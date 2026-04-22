import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import type { SafeUser } from '../types/safe-user.type';

describe('JwtStrategy', () => {
  const mockSafeUser: SafeUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Said',
    lastName: 'Ait',
    occupation: null,
    role: 'USER',
    plan: 'FREE',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const createStrategy = () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;
    const authService = {
      validateUser: jest.fn(),
    } as unknown as AuthService;

    const strategy = new JwtStrategy(configService, authService);

    return {
      strategy,
      configService: configService as ConfigService & {
        getOrThrow: jest.Mock;
      },
      authService: authService as AuthService & {
        validateUser: jest.Mock;
      },
    };
  };

  it('reads the JWT secret from config during construction', () => {
    const { strategy, configService } = createStrategy();

    expect(strategy).toBeInstanceOf(JwtStrategy);
    expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('returns the validated safe user for a valid payload', async () => {
    const { strategy, authService } = createStrategy();
    const payload = {
      sub: 1,
      email: 'test@example.com',
      role: 'USER',
      plan: 'FREE',
    };

    authService.validateUser.mockResolvedValue(mockSafeUser);

    await expect(strategy.validate(payload)).resolves.toEqual(mockSafeUser);
    expect(authService.validateUser).toHaveBeenCalledWith(payload);
  });

  it('throws UnauthorizedException when the token resolves to no user', async () => {
    const { strategy, authService } = createStrategy();
    const payload = {
      sub: 999,
      email: 'missing@example.com',
      role: 'USER',
      plan: 'FREE',
    };

    authService.validateUser.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
