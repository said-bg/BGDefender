import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { PasswordTokenService } from './services/password-token.service';
import type { SafeUser } from './types/safe-user.type';

describe('AuthController', () => {
  let controller: AuthController;

  const mockSafeUser: SafeUser = {
    id: 1,
    email: 'test@example.com',
    role: 'USER',
    plan: 'FREE',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
  };

  const mockEmailService = {
    sendPasswordResetEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
  };

  const mockPasswordTokenService = {
    createResetToken: jest.fn(),
    findTokenByPlainToken: jest.fn(),
    markAsUsed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: PasswordTokenService,
          useValue: mockPasswordTokenService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with correct DTO', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      mockAuthService.register.mockResolvedValue(mockSafeUser);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockSafeUser);
    });

    it('should return SafeUser without password', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'Password123',
      };

      // 🎯 FIX: Mock doit retourner user avec l'email du DTO
      const mockUserWithCorrectEmail: SafeUser = {
        ...mockSafeUser,
        email: registerDto.email,
      };
      mockAuthService.register.mockResolvedValue(mockUserWithCorrectEmail);

      const result = await controller.register(registerDto);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('login', () => {
    it('should call authService.login with correct DTO', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const loginResponse = {
        accessToken: 'jwt_token_here',
        user: mockSafeUser,
      };

      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result.accessToken).toBeDefined();
      expect(result.user).toEqual(mockSafeUser);
    });

    it('should return accessToken and SafeUser', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const loginResponse = {
        accessToken: 'jwt_token_here',
        user: mockSafeUser,
      };

      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user', () => {
      const result = controller.getCurrentUser(mockSafeUser);

      expect(result).toEqual(mockSafeUser);
      expect(result.id).toBe(1);
      expect(result.email).toBe('test@example.com');
    });

    it('should not expose password property', () => {
      const result = controller.getCurrentUser(mockSafeUser);

      expect(result).not.toHaveProperty('password');
    });
  });
});
