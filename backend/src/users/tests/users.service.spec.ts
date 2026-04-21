import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User, UserPlan, UserRole } from '../../entities/user.entity';
import { UsersService } from '../services/users.service';

type MockUserRepository = Pick<
  Repository<User>,
  'createQueryBuilder' | 'findOne' | 'save' | 'remove'
> & {
  createQueryBuilder: jest.Mock;
  findOne: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
};

type MockQueryBuilder = {
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  take: jest.Mock;
  skip: jest.Mock;
  getManyAndCount: jest.Mock;
};

const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 1,
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    occupation: 'Analyst',
    password: 'hashed-password',
    role: UserRole.USER,
    plan: UserPlan.FREE,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }) as User;

const createMockQueryBuilder = (): MockQueryBuilder => {
  const queryBuilder: MockQueryBuilder = {
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    take: jest.fn(),
    skip: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  queryBuilder.andWhere.mockReturnValue(queryBuilder);
  queryBuilder.orderBy.mockReturnValue(queryBuilder);
  queryBuilder.take.mockReturnValue(queryBuilder);
  queryBuilder.skip.mockReturnValue(queryBuilder);

  return queryBuilder;
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockUserRepository;
  let queryBuilder: MockQueryBuilder;

  beforeEach(async () => {
    queryBuilder = createMockQueryBuilder();

    userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('lists users with safe payloads and no password leakage', async () => {
      const user = createMockUser();
      queryBuilder.getManyAndCount.mockResolvedValue([[user], 1]);

      const result = await service.listUsers({
        limit: 25,
        offset: 0,
      });

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'user.createdAt',
        'DESC',
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(25);
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result.count).toBe(1);
      expect(result.data[0]).toMatchObject({
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
      });
      expect(result.data[0]).not.toHaveProperty('password');
    });

    it('applies search, plan and role filters to the admin user query', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[createMockUser()], 1]);

      await service.listUsers({
        search: '  Test   User  ',
        plan: UserPlan.PREMIUM,
        role: UserRole.CREATOR,
        limit: 10,
        offset: 5,
      });

      // The search term is normalized before being injected into the query builder.
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        expect.any(Brackets),
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'user.plan = :plan',
        { plan: UserPlan.PREMIUM },
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        3,
        'user.role = :role',
        { role: UserRole.CREATOR },
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    });
  });

  describe('updateAdminUser', () => {
    it('updates plan and role for another user', async () => {
      userRepository.findOne.mockResolvedValue(createMockUser());
      userRepository.save.mockImplementation((user: User) =>
        Promise.resolve(user),
      );

      const result = await service.updateAdminUser(
        1,
        {
          plan: UserPlan.PREMIUM,
          role: UserRole.CREATOR,
        },
        999,
      );

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          plan: UserPlan.PREMIUM,
          role: UserRole.CREATOR,
          isActive: true,
        }),
      );
      expect(result.plan).toBe(UserPlan.PREMIUM);
      expect(result.role).toBe(UserRole.CREATOR);
      expect(result).not.toHaveProperty('password');
    });

    it('updates only the provided flags and keeps other values intact', async () => {
      const user = createMockUser({
        plan: UserPlan.FREE,
        role: UserRole.USER,
        isActive: true,
      });
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockImplementation((value: User) =>
        Promise.resolve(value),
      );

      const result = await service.updateAdminUser(
        1,
        {
          isActive: false,
        },
        999,
      );

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          plan: UserPlan.FREE,
          role: UserRole.USER,
          isActive: false,
        }),
      );
      expect(result.isActive).toBe(false);
      expect(result.plan).toBe(UserPlan.FREE);
    });

    it('rejects removing own admin access', async () => {
      userRepository.findOne.mockResolvedValue(
        createMockUser({
          id: 42,
          role: UserRole.ADMIN,
        }),
      );

      await expect(
        service.updateAdminUser(
          42,
          {
            role: UserRole.USER,
          },
          42,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('allows an admin to update their own account when the change is permitted', async () => {
      const admin = createMockUser({
        id: 42,
        role: UserRole.ADMIN,
        plan: UserPlan.FREE,
        isActive: true,
      });

      userRepository.findOne.mockResolvedValue(admin);
      userRepository.save.mockImplementation((user: User) =>
        Promise.resolve(user),
      );

      const result = await service.updateAdminUser(
        42,
        { plan: UserPlan.PREMIUM },
        42,
      );

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 42,
          role: UserRole.ADMIN,
          plan: UserPlan.PREMIUM,
          isActive: true,
        }),
      );
      expect(result.plan).toBe(UserPlan.PREMIUM);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('returns a translated error when trying to remove own admin access in finnish', async () => {
      userRepository.findOne.mockResolvedValue(
        createMockUser({
          id: 42,
          role: UserRole.ADMIN,
        }),
      );

      await expect(
        service.updateAdminUser(
          42,
          {
            role: UserRole.USER,
          },
          42,
          'fi',
        ),
      ).rejects.toThrow('Et voi poistaa omaa admin-oikeuttasi');
    });

    it('rejects deactivating own account', async () => {
      userRepository.findOne.mockResolvedValue(
        createMockUser({
          id: 42,
          role: UserRole.ADMIN,
        }),
      );

      await expect(
        service.updateAdminUser(
          42,
          {
            isActive: false,
          },
          42,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(userRepository.save).not.toHaveBeenCalled();
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
  });

  describe('deleteAdminUser', () => {
    it('deletes another user account', async () => {
      const user = createMockUser();
      userRepository.findOne.mockResolvedValue(user);
      userRepository.remove.mockResolvedValue(user);

      const result = await service.deleteAdminUser(user.id, 999);

      expect(userRepository.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: user.id }),
      );
      expect(result).toEqual({
        message: 'User deleted successfully.',
      });
    });

    it('rejects deleting own account', async () => {
      userRepository.findOne.mockResolvedValue(
        createMockUser({
          id: 42,
          role: UserRole.ADMIN,
        }),
      );

      await expect(service.deleteAdminUser(42, 42)).rejects.toThrow(
        BadRequestException,
      );

      expect(userRepository.remove).not.toHaveBeenCalled();
    });

    it('returns a translated error when deleting own account in finnish', async () => {
      userRepository.findOne.mockResolvedValue(
        createMockUser({
          id: 42,
          role: UserRole.ADMIN,
        }),
      );

      await expect(service.deleteAdminUser(42, 42, 'fi')).rejects.toThrow(
        'Et voi poistaa omaa tiliasi',
      );
    });

    it('throws when deleting a missing user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteAdminUser(999, 1)).rejects.toThrow(
        NotFoundException,
      );

      expect(userRepository.remove).not.toHaveBeenCalled();
    });

    it('returns a translated success message when deleting in finnish', async () => {
      const user = createMockUser({
        id: 7,
      });
      userRepository.findOne.mockResolvedValue(user);
      userRepository.remove.mockResolvedValue(user);

      const result = await service.deleteAdminUser(7, 1, 'fi');

      expect(result).toEqual({
        message: 'Kayttaja poistettiin onnistuneesti.',
      });
    });
  });
});
