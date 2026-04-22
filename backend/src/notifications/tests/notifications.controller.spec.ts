import { Test, TestingModule } from '@nestjs/testing';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { NotificationsController } from '../controllers/notifications.controller';
import { NotificationsService } from '../services/notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const currentUser: SafeUser = {
    id: 7,
    email: 'user@example.com',
    firstName: 'User',
    lastName: 'Example',
    occupation: null,
    role: 'USER',
    plan: 'FREE',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const notificationsService = {
    listMyNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    clearAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('delegates notification listing with a parsed numeric limit', async () => {
    notificationsService.listMyNotifications.mockResolvedValue({
      data: [],
      unreadCount: 0,
    });

    await controller.listMyNotifications(currentUser, '12');

    expect(notificationsService.listMyNotifications).toHaveBeenCalledWith(
      currentUser.id,
      12,
    );
  });

  it('falls back to the default limit when the query is invalid', async () => {
    notificationsService.listMyNotifications.mockResolvedValue({
      data: [],
      unreadCount: 0,
    });

    await controller.listMyNotifications(currentUser, 'abc');

    expect(notificationsService.listMyNotifications).toHaveBeenCalledWith(
      currentUser.id,
      8,
    );
  });

  it('delegates single-notification reads', async () => {
    notificationsService.markAsRead.mockResolvedValue(undefined);

    await controller.markAsRead(currentUser, 'notification-1');

    expect(notificationsService.markAsRead).toHaveBeenCalledWith(
      currentUser.id,
      'notification-1',
    );
  });

  it('delegates bulk notification reads', async () => {
    notificationsService.markAllAsRead.mockResolvedValue(undefined);

    await controller.markAllAsRead(currentUser);

    expect(notificationsService.markAllAsRead).toHaveBeenCalledWith(
      currentUser.id,
    );
  });

  it('delegates notification cleanup for the current user', async () => {
    notificationsService.clearAll.mockResolvedValue(undefined);

    await controller.clearAll(currentUser);

    expect(notificationsService.clearAll).toHaveBeenCalledWith(currentUser.id);
  });
});
