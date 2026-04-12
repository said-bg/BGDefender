import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole, UserPlan } from '../entities/user.entity';
import { SECURITY_RULES } from '../constants/security.constants';
import { SafeUser, toSafeUser } from './types/safe-user.type';
import { JwtPayload } from './types/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CertificatesService } from '../certificates/certificates.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly certificatesService: CertificatesService,
  ) {}

  async register(dto: RegisterDto, language: string = 'en'): Promise<SafeUser> {
    const { email, password } = dto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      const errorMessage =
        language === 'fi'
          ? 'Sahkopostiosoite on jo kaytossa'
          : 'Email already in use';
      throw new ConflictException(errorMessage);
    }

    this.validatePassword(password);

    const hashedPassword = await bcrypt.hash(
      password,
      SECURITY_RULES.BCRYPT_ROUNDS,
    );

    const user = this.userRepository.create({
      email,
      firstName: null,
      lastName: null,
      occupation: null,
      password: hashedPassword,
      role: UserRole.USER,
      plan: UserPlan.FREE,
      isActive: true,
    });

    await this.userRepository.save(user);

    return toSafeUser(user);
  }

  async login(
    dto: LoginDto,
    language: string = 'en',
  ): Promise<{ accessToken: string; user: SafeUser }> {
    const { email, password } = dto;

    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      const errorMessage =
        language === 'fi'
          ? 'Virheellinen sahkopostiosoite tai salasana'
          : 'Invalid email or password';
      throw new UnauthorizedException(errorMessage);
    }

    if (!user.isActive) {
      const errorMessage =
        language === 'fi'
          ? 'Tili on poistettu kaytosta'
          : 'Account is inactive';
      throw new UnauthorizedException(errorMessage);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const errorMessage =
        language === 'fi'
          ? 'Virheellinen sahkopostiosoite tai salasana'
          : 'Invalid email or password';
      throw new UnauthorizedException(errorMessage);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: toSafeUser(user),
    };
  }

  async validateUser(payload: JwtPayload): Promise<SafeUser | null> {
    const userId = payload.sub;
    if (!userId) {
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user || !user.isActive) {
      return null;
    }

    return toSafeUser(user);
  }

  private validatePassword(password: string): void {
    if (password.length < SECURITY_RULES.PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${SECURITY_RULES.PASSWORD_MIN_LENGTH} characters long`,
      );
    }

    if (!SECURITY_RULES.PASSWORD_REGEX.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter and one digit',
      );
    }
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    return user ? toSafeUser(user) : null;
  }

  async updatePassword(
    email: string,
    newPassword: string,
    language: string = 'en',
  ): Promise<void> {
    this.validatePassword(newPassword);

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      const errorMessage =
        language === 'fi'
          ? 'Uusi salasanasi on oltava erilainen kuin nykyinen salasanasi.'
          : 'Your new password must be different from your current password.';
      throw new BadRequestException(errorMessage);
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      SECURITY_RULES.BCRYPT_ROUNDS,
    );

    await this.userRepository.update(
      { id: user.id },
      { password: hashedPassword },
    );
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<SafeUser> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.firstName = dto.firstName?.trim() || null;
    user.lastName = dto.lastName?.trim() || null;
    user.occupation = dto.occupation?.trim() || null;

    const updatedUser = await this.userRepository.save(user);
    await this.certificatesService.syncPendingCertificatesForUser(
      updatedUser.id,
    );
    return toSafeUser(updatedUser);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    language: string = 'en',
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      const errorMessage =
        language === 'fi'
          ? 'Nykyinen salasana on virheellinen'
          : 'Current password is invalid';
      throw new BadRequestException(errorMessage);
    }

    await this.updatePassword(user.email, newPassword, language);
  }
}
