import {
  BadRequestException,
  ConflictException,
  Injectable,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Enregistre un nouvel utilisateur
   * - Email unique obligatoire
   * - Password fort (validé par DTO et re-validé ici)
   * - Role: USER, Plan: FREE (hardcodé, client ne peut pas override)
   * - Retourne SafeUser (pas de token à la registration)
   * - Accepts language param for localized error messages
   */
  async register(dto: RegisterDto, language: string = 'en'): Promise<SafeUser> {
    const { email, password } = dto;

    // Vérifier si email existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      const errorMessage =
        language === 'fi'
          ? 'Sähköpostiosoite on jo käytössä'
          : 'Email already in use';
      throw new ConflictException(errorMessage);
    }

    // Revalider le password avec SECURITY_RULES (source de vérité)
    this.validatePassword(password);

    // Hasher le password
    const hashedPassword = await bcrypt.hash(
      password,
      SECURITY_RULES.BCRYPT_ROUNDS,
    );

    // Créer l'utilisateur avec defaults Phase 1
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      role: UserRole.USER, // Hardcoded: client ne peut pas être CREATOR/ADMIN
      plan: UserPlan.FREE, // Hardcoded: plan premium viendra plus tard
      isActive: true,
    });

    // Sauvegarder
    await this.userRepository.save(user);

    // Retourner SafeUser (pas de token)
    return toSafeUser(user);
  }

  /**
   * Authentifie l'utilisateur et génère JWT
   * - Vérifie email/password
   * - Accepte seulement utilisateurs actifs
   * - Retourne {accessToken, user: SafeUser}
   * - Accepts language param for localized error messages
   */
  async login(
    dto: LoginDto,
    language: string = 'en',
  ): Promise<{ accessToken: string; user: SafeUser }> {
    const { email, password } = dto;

    // Chercher user par email
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      const errorMessage =
        language === 'fi'
          ? 'Virheellinen sähköpostiosoite tai salasana'
          : 'Invalid email or password';
      throw new UnauthorizedException(errorMessage);
    }

    // Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      const errorMessage =
        language === 'fi'
          ? 'Tilisi on poistettu käytöstä'
          : 'Account is inactive';
      throw new UnauthorizedException(errorMessage);
    }

    // Comparer le password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const errorMessage =
        language === 'fi'
          ? 'Virheellinen sähköpostiosoite tai salasana'
          : 'Invalid email or password';
      throw new UnauthorizedException(errorMessage);
    }

    // Générer JWT payload avec sub standard
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };

    const accessToken = this.jwtService.sign(payload);

    // Retourner token + SafeUser
    return {
      accessToken,
      user: toSafeUser(user),
    };
  }

  /**
   * Valide un JWT payload et retourne l'utilisateur
   * - Utilisé par JWT Strategy
   * - Retourne null si user absent ou inactif (pas exception)
   */
  async validateUser(payload: JwtPayload): Promise<SafeUser | null> {
    // Extraire user.id du payload JWT
    const userId = payload.sub;
    if (!userId) {
      return null;
    }

    // Chercher user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      return null;
    }

    // Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      return null;
    }

    // Retourner SafeUser
    return toSafeUser(user);
  }

  /**
   * Valide le password selon SECURITY_RULES
   * Lance une exception si invalide
   */
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

  /**
   * Find user by email
   * Utilisé pour forgot-password
   * Returns null si user pas trouvé (ne pas leak existence!)
   */
  async findByEmail(email: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    return user ? toSafeUser(user) : null;
  }

  /**
   * Update user password
   * Utilisé pour reset-password
   * language param for error message localization (en or fi)
   */
  async updatePassword(
    email: string,
    newPassword: string,
    language: string = 'en',
  ): Promise<void> {
    // Validate new password
    this.validatePassword(newPassword);

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      const errorMessage =
        language === 'fi'
          ? 'Uusi salasanasi on oltava erilainen kuin nykyinen salasanasi.'
          : 'Your new password must be different from your current password.';
      throw new BadRequestException(errorMessage);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      SECURITY_RULES.BCRYPT_ROUNDS,
    );

    // Update password
    await this.userRepository.update(
      { id: user.id },
      { password: hashedPassword },
    );
  }
}
