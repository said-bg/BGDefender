import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { toSafeUser } from '../../auth/types/safe-user.type';
import { ListUsersDto } from '../dto/list-users.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import type { AppLanguage } from '../../config/request-language';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async listUsers(
    query: ListUsersDto,
  ): Promise<{ data: SafeUser[]; count: number }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (query.search) {
      const normalizedSearchValue = query.search
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      const normalizedSearch = `%${normalizedSearchValue}%`;

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user.email) LIKE :search', {
            search: normalizedSearch,
          })
            .orWhere('LOWER(user.firstName) LIKE :search', {
              search: normalizedSearch,
            })
            .orWhere('LOWER(user.lastName) LIKE :search', {
              search: normalizedSearch,
            })
            .orWhere('LOWER(user.occupation) LIKE :search', {
              search: normalizedSearch,
            })
            .orWhere(
              "LOWER(TRIM(CONCAT(COALESCE(user.firstName, ''), ' ', COALESCE(user.lastName, '')))) LIKE :search",
              {
                search: normalizedSearch,
              },
            )
            .orWhere(
              "LOWER(TRIM(CONCAT(COALESCE(user.lastName, ''), ' ', COALESCE(user.firstName, '')))) LIKE :search",
              {
                search: normalizedSearch,
              },
            );
        }),
      );
    }

    if (query.plan) {
      queryBuilder.andWhere('user.plan = :plan', { plan: query.plan });
    }

    if (query.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    const [users, count] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .take(query.limit)
      .skip(query.offset)
      .getManyAndCount();

    return {
      data: users.map((user) => toSafeUser(user)),
      count,
    };
  }

  async updateAdminUser(
    userId: number,
    dto: UpdateAdminUserDto,
    currentAdminId: number,
    language: AppLanguage = 'en',
  ): Promise<SafeUser> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === currentAdminId) {
      if (dto.role && dto.role !== UserRole.ADMIN) {
        throw new BadRequestException(
          language === 'fi'
            ? 'Et voi poistaa omaa admin-oikeuttasi'
            : 'You cannot remove your own admin access',
        );
      }

      if (dto.isActive === false) {
        throw new BadRequestException(
          language === 'fi'
            ? 'Et voi poistaa omaa tiliasi kaytosta'
            : 'You cannot deactivate your own account',
        );
      }
    }

    if (dto.plan !== undefined) {
      user.plan = dto.plan;
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    const updatedUser = await this.userRepository.save(user);
    return toSafeUser(updatedUser);
  }

  async deleteAdminUser(
    userId: number,
    currentAdminId: number,
    language: AppLanguage = 'en',
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === currentAdminId) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Et voi poistaa omaa tiliasi'
          : 'You cannot delete your own account',
      );
    }

    await this.userRepository.remove(user);

    return {
      message:
        language === 'fi'
          ? 'Kayttaja poistettiin onnistuneesti.'
          : 'User deleted successfully.',
    };
  }
}
