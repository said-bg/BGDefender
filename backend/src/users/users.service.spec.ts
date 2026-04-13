import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User, UserPlan, UserRole } from '../entities/user.entity';
import { UsersService } from './users.service';

type MockUserRepository = {
  createQueryBuilder: jest.Mock;
  findOne: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockUserRepository;

  const mockUser: User = {
    id: 1,
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    occupation: 'Analyst',
    password: 'hashed-password',
    role: UserRole.USER,
    plan: UserPlan.FREE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('lists users with safe payloads', async () => {
    const queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
    };

    userRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await service.listUsers({
      limit: 25,
      offset: 0,
    });

    expect(result.count).toBe(1);
    expect(result.data[0]).toMatchObject({
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      plan: mockUser.plan,
    });
    expect(result.data[0]).not.toHaveProperty('password');
  });

  it('updates plan and role for another user', async () => {
    userRepository.findOne.mockResolvedValue({ ...mockUser });
    userRepository.save.mockImplementation((user: User) =>
      Promise.resolve(user),
    );

    const result = await service.updateAdminUser(
      mockUser.id,
      {
        plan: UserPlan.PREMIUM,
        role: UserRole.CREATOR,
      },
      999,
    );

    expect(result.plan).toBe(UserPlan.PREMIUM);
    expect(result.role).toBe(UserRole.CREATOR);
  });

  it('rejects removing own admin access', async () => {
    userRepository.findOne.mockResolvedValue({
      ...mockUser,
      id: 42,
      role: UserRole.ADMIN,
    });

    await expect(
      service.updateAdminUser(
        42,
        {
          role: UserRole.USER,
        },
        42,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects deactivating own account', async () => {
    userRepository.findOne.mockResolvedValue({
      ...mockUser,
      id: 42,
      role: UserRole.ADMIN,
    });

    await expect(
      service.updateAdminUser(
        42,
        {
          isActive: false,
        },
        42,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when user does not exist', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updateAdminUser(
        999,
        {
          plan: UserPlan.PREMIUM,
        },
        1,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes another user account', async () => {
    userRepository.findOne.mockResolvedValue({ ...mockUser });
    userRepository.remove.mockResolvedValue(undefined);

    const result = await service.deleteAdminUser(mockUser.id, 999);

    expect(userRepository.remove).toHaveBeenCalledWith(
      expect.objectContaining({ id: mockUser.id }),
    );
    expect(result).toEqual({
      message: 'User deleted successfully.',
    });
  });

  it('rejects deleting own account', async () => {
    userRepository.findOne.mockResolvedValue({
      ...mockUser,
      id: 42,
      role: UserRole.ADMIN,
    });

    await expect(service.deleteAdminUser(42, 42)).rejects.toThrow(
      BadRequestException,
    );
  });
});
