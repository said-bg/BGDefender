import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { Author } from '../entities/author.entity';
import { Course } from '../entities/course.entity';
import { Chapter } from '../entities/chapter.entity';
import { SubChapter } from '../entities/sub-chapter.entity';
import { PedagogicalContent } from '../entities/pedagogical-content.entity';
import { Progress } from '../entities/progress.entity';
import { Favorite } from '../entities/favorite.entity';
import { Resource } from '../entities/resource.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isDev = this.configService.get('NODE_ENV') !== 'production';
    const enableDatabaseLogging =
      this.configService.get('DATABASE_LOGGING') === 'true';

    return {
      type: 'mysql',
      host: this.configService.get('DATABASE_HOST') || 'localhost',
      port: this.configService.get('DATABASE_PORT') || 3306,
      username: this.configService.getOrThrow('DATABASE_USERNAME'), // Obligatoire desde .env
      password: this.configService.getOrThrow('DATABASE_PASSWORD'), // Obligatoire, jamais en clair
      database: this.configService.getOrThrow('DATABASE_NAME'), // Obligatoire
      entities: [
        User,
        PasswordResetToken,
        Author,
        Course,
        Chapter,
        SubChapter,
        PedagogicalContent,
        Progress,
        Favorite,
        Resource,
      ],
      synchronize: isDev,
      logging: enableDatabaseLogging,
    };
  }
}
