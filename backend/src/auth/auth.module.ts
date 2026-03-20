import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { User } from '../entities/user.entity';
import { SECURITY_RULES } from '../constants/security.constants';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // TypeORM: expose UserRepository
    TypeOrmModule.forFeature([User]),

    // Passport: configure strategies
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT: configure signing/verification
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev-secret-key'),
        signOptions: {
          expiresIn: SECURITY_RULES.JWT_EXPIRES_IN as any,
          algorithm: SECURITY_RULES.JWT_ALGORITHM,
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
