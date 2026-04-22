import { Test, TestingModule } from '@nestjs/testing';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const currentAdmin: SafeUser = {
    id: 42,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    occupation: null,
    role: 'ADMIN',
    plan: 'PREMIUM',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const usersService = {
    listUsers: jest.fn(),
    updateAdminUser: jest.fn(),
    deleteAdminUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('delegates user listing to the service', async () => {
    const query = { search: 'said', limit: 10, offset: 0 };
    usersService.listUsers.mockResolvedValue({ data: [], count: 0 });

    await controller.listUsers(query);

    expect(usersService.listUsers).toHaveBeenCalledWith(query);
  });

  it('delegates admin user updates with the resolved language', async () => {
    const dto = { role: 'USER' };
    usersService.updateAdminUser.mockResolvedValue({ id: 7 });

    await controller.updateUser(7, dto, currentAdmin, 'fi-FI,fi;q=0.9');

    expect(usersService.updateAdminUser).toHaveBeenCalledWith(
      7,
      dto,
      currentAdmin.id,
      'fi',
    );
  });

  it('falls back to english when deleting a user without a language header', async () => {
    usersService.deleteAdminUser.mockResolvedValue({
      message: 'User deleted successfully.',
    });

    await controller.deleteUser(7, currentAdmin);

    expect(usersService.deleteAdminUser).toHaveBeenCalledWith(
      7,
      currentAdmin.id,
      'en',
    );
  });
});
