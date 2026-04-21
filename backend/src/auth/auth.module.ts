import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { User } from '../entities/user.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { SECURITY_RULES } from '../constants/security.constants';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordTokenService } from './services/password-token.service';
import { EmailModule } from '../email/email.module';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [
    // TypeORM: expose User and PasswordResetToken repositories
    TypeOrmModule.forFeature([User, PasswordResetToken]),

    // Passport: configure strategies
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT: configure signing/verification
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: SECURITY_RULES.JWT_EXPIRES_IN,
          algorithm: SECURITY_RULES.JWT_ALGORITHM,
        },
      }),
    }),

    // Email module
    EmailModule,
    // Certificates module: sync pending certificates after profile completion
    CertificatesModule,
  ],
  providers: [AuthService, JwtStrategy, PasswordTokenService],
  controllers: [AuthController],
  exports: [AuthService, PasswordTokenService],
})
export class AuthModule {}
