import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { User, UserRole, UserPlan } from '../entities/user.entity';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

// Mock bcrypt at module level
jest.mock('bcrypt');

import * as bcrypt from 'bcrypt';

type MockUserRepository = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

type MockJwtService = {
  sign: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: MockUserRepository;
  let jwtService: MockJwtService;

  const mockedBcrypt = jest.mocked(bcrypt);

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashed-password-123',
    role: UserRole.USER,
    plan: UserPlan.FREE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    mockedBcrypt.hash.mockResolvedValue('hashed-password-123' as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user with FREE plan and USER role', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password1',
      };

      const createdUser: User = {
        ...mockUser,
        email: registerDto.email,
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result.email).toBe(registerDto.email);
      expect(result.role).toBe(UserRole.USER);
      expect(result.plan).toBe(UserPlan.FREE);
      expect(result).not.toHaveProperty('password');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password1',
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password is too short', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Pass1',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password lacks uppercase letter', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password lacks digit', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'PasswordOnly',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return accessToken and safe user for valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password1',
      };
      const mockToken = 'mock-jwt-token-123';

      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe(mockToken);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.role).toBe(UserRole.USER);
      expect(result.user.plan).toBe(UserPlan.FREE);
      expect(result.user).not.toHaveProperty('password');

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        plan: mockUser.plan,
      });
    });

    it('should throw UnauthorizedException if email does not exist', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password1',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password1',
      };

      const inactiveUser: User = {
        ...mockUser,
        isActive: false,
      };

      userRepository.findOne.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword1',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return safe user if payload is valid', async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: UserRole.USER,
        plan: UserPlan.FREE,
      };

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(payload);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        plan: mockUser.plan,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if sub is missing', async () => {
      const payload = {
        email: 'test@example.com',
        role: UserRole.USER,
        plan: UserPlan.FREE,
      } as Parameters<AuthService['validateUser']>[0];

      const result = await service.validateUser(payload);

      expect(result).toBeNull();
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return null if user does not exist', async () => {
      const payload = {
        sub: 999,
        email: 'test@example.com',
        role: UserRole.USER,
        plan: UserPlan.FREE,
      };

      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(payload);

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      const inactiveUser: User = {
        ...mockUser,
        isActive: false,
      };

      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: UserRole.USER,
        plan: UserPlan.FREE,
      };

      userRepository.findOne.mockResolvedValue(inactiveUser);

      const result = await service.validateUser(payload);

      expect(result).toBeNull();
    });
  });
});
