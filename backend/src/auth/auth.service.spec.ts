/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

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

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  // Mock user réutilisable
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
    // Setup module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<jest.Mocked<Repository<User>>>(
      getRepositoryToken(User),
    );
    jwtService = module.get<jest.Mocked<JwtService>>(JwtService);

    // Mock bcrypt functions
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password-123');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // REGISTER TESTS
  // ============================================================

  describe('register', () => {
    it('should create a new user with FREE plan and USER role', async () => {
      // Arrange
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password1',
      };
      userRepository.findOne.mockResolvedValue(null as any);
      userRepository.create.mockReturnValue({
        ...mockUser,
        email: registerDto.email,
      } as any);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      } as any);

      // Act
      const result = await service.register(registerDto);

      // Assert
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
      // Arrange
      const registerDto = { email: 'test@example.com', password: 'Password1' };
      userRepository.findOne.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password is too short', async () => {
      // Arrange
      const registerDto = { email: 'test@example.com', password: 'Pass1' }; // < 8 chars
      userRepository.findOne.mockResolvedValue(null as any);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password lacks uppercase letter', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      }; // no uppercase
      userRepository.findOne.mockResolvedValue(null as any);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password lacks digit', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'PasswordOnly',
      }; // no digit
      userRepository.findOne.mockResolvedValue(null as any);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // LOGIN TESTS
  // ============================================================

  describe('login', () => {
    it('should return accessToken and safe user for valid credentials', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'Password1' };
      const mockToken = 'mock-jwt-token-123';

      userRepository.findOne.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue(mockToken);

      // Act
      const result = await service.login(loginDto);

      // Assert
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
      // Arrange
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password1',
      };
      userRepository.findOne.mockResolvedValue(null as any);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'Password1' };
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(inactiveUser as any);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword1',
      };
      userRepository.findOne.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // VALIDATEUSER TESTS
  // ============================================================

  describe('validateUser', () => {
    it('should return safe user if payload is valid', async () => {
      // Arrange
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: UserRole.USER,
        plan: UserPlan.FREE,
      };
      userRepository.findOne.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.validateUser(payload);

      // Assert
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
      // Arrange
      const payload = {
        email: 'test@example.com',
        role: UserRole.USER,
        plan: UserPlan.FREE,
      } as any;

      // Act
      const result = await service.validateUser(payload);

      // Assert
      expect(result).toBeNull();
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return null if user does not exist', async () => {
      // Arrange
      const payload = {
        sub: 999,
        email: 'test@example.com',
        role: UserRole.USER,
        plan: UserPlan.FREE,
      };
      userRepository.findOne.mockResolvedValue(null as any);

      // Act
      const result = await service.validateUser(payload);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: UserRole.USER,
        plan: UserPlan.FREE,
      };
      userRepository.findOne.mockResolvedValue(inactiveUser as any);

      // Act
      const result = await service.validateUser(payload);

      // Assert
      expect(result).toBeNull();
    });
  });
});
