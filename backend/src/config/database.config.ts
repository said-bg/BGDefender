import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isDev = this.configService.get('NODE_ENV') !== 'production';

    return {
      type: 'mysql',
      host: this.configService.get('DATABASE_HOST') || 'localhost',
      port: this.configService.get('DATABASE_PORT') || 3307,
      username: this.configService.get('DATABASE_USERNAME') || 'bguser',
      password: this.configService.get('DATABASE_PASSWORD') || 'bg_user_2026',
      database: this.configService.get('DATABASE_NAME') || 'bgdefender',
      entities: [User, PasswordResetToken], // Registrer les entities explicitement
      synchronize: isDev, // JAMAIS true en production
      logging: isDev,
    };
  }
}
