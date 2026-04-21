import { NotFoundException } from '@nestjs/common';
import {
  clearAll,
  listMyNotifications,
  markAllAsRead,
  markAsRead,
} from '../services/notifications.readers';
import {
  createDependencies,
  createNotification,
  getSavedNotification,
  getSavedNotifications,
} from './notifications.test-helpers';

describe('notifications.readers', () => {
  describe('listMyNotifications', () => {
    it('lists notifications, clamps the limit and returns a safe unread count', async () => {
      const dependencies = createDependencies();

      dependencies.notificationRepository.find.mockResolvedValue([
        createNotification({
          id: 'notification-1',
          resourceId: 'resource-1',
          isRead: false,
        }),
        createNotification({
          id: 'notification-2',
          resourceId: 'resource-2',
          resourceTitleSnapshot: 'Playbook',
          isRead: true,
          readAt: new Date('2026-01-03T00:00:00.000Z'),
        }),
      ]);
      dependencies.notificationRepository.count.mockResolvedValue(5);
      dependencies.resourceRepository.find.mockResolvedValue([
        { id: 'resource-1' },
        { id: 'resource-2' },
      ]);
      dependencies.courseRepository.find.mockResolvedValue([]);

      const result = await listMyNotifications(dependencies, 7, 50);

      expect(dependencies.notificationRepository.find).toHaveBeenCalledWith({
        where: { userId: 7 },
        order: { createdAt: 'DESC' },
        take: 20,
      });
      expect(result.unreadCount).toBe(1);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          resourceTitle: 'Security guide',
        }),
      );
    });

    it('clamps the notification limit to at least 1', async () => {
      const dependencies = createDependencies();

      dependencies.notificationRepository.find.mockResolvedValue([]);
      dependencies.notificationRepository.count.mockResolvedValue(0);
      dependencies.resourceRepository.find.mockResolvedValue([]);
      dependencies.courseRepository.find.mockResolvedValue([]);

      await listMyNotifications(dependencies, 7, 0);

      expect(dependencies.notificationRepository.find).toHaveBeenCalledWith({
        where: { userId: 7 },
        order: { createdAt: 'DESC' },
        take: 1,
      });
    });

    it('cleans orphaned resource notifications while listing', async () => {
      const dependencies = createDependencies();

      dependencies.notificationRepository.find.mockResolvedValue([
        createNotification({
          id: 'notification-1',
          resourceId: 'resource-missing',
          resourceTitleSnapshot: 'Old guide',
        }),
      ]);
      dependencies.notificationRepository.count.mockResolvedValue(1);
      dependencies.resourceRepository.find.mockResolvedValue([]);
      dependencies.courseRepository.find.mockResolvedValue([]);

      const result = await listMyNotifications(dependencies, 7);

      expect(dependencies.notificationRepository.delete).toHaveBeenCalledWith([
        'notification-1',
      ]);
      expect(result.data).toEqual([]);
      expect(result.unreadCount).toBe(0);
    });

    it('cleans orphaned course notifications while listing', async () => {
      const dependencies = createDependencies();

      dependencies.notificationRepository.find.mockResolvedValue([
        createNotification({
          id: 'notification-course-1',
          courseId: 'course-missing',
          courseTitleEnSnapshot: 'Old course',
          courseTitleFiSnapshot: 'Vanha kurssi',
          link: '/courses/course-missing',
          resourceId: null,
          resourceTitleSnapshot: null,
        }),
      ]);
      dependencies.notificationRepository.count.mockResolvedValue(1);
      dependencies.resourceRepository.find.mockResolvedValue([]);
      dependencies.courseRepository.find.mockResolvedValue([]);

      const result = await listMyNotifications(dependencies, 7);

      expect(dependencies.notificationRepository.delete).toHaveBeenCalledWith([
        'notification-course-1',
      ]);
      expect(result.data).toEqual([]);
      expect(result.unreadCount).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('marks an unread notification as read', async () => {
      const dependencies = createDependencies();

      dependencies.notificationRepository.findOne.mockResolvedValue(
        createNotification({
          id: 'notification-1',
          isRead: false,
        }),
      );

      await markAsRead(dependencies, 7, 'notification-1');

      expect(dependencies.notificationRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'notification-1',
          userId: 7,
        },
      });
      const savedNotification = getSavedNotification(dependencies);

      expect(savedNotification.id).toBe('notification-1');
      expect(savedNotification.isRead).toBe(true);
      expect(savedNotification.readAt).toBeInstanceOf(Date);
    });

    it('does nothing when the notification is already read', async () => {
      const dependencies = createDependencies();

      dependencies.notificationRepository.findOne.mockResolvedValue(
        createNotification({
          id: 'notification-1',
          isRead: true,
          readAt: new Date('2026-01-03T00:00:00.000Z'),
        }),
      );

      await markAsRead(dependencies, 7, 'notification-1');

      expect(dependencies.notificationRepository.save).not.toHaveBeenCalled();
    });

    it('throws when the notification does not belong to the user', async () => {
      const dependencies = createDependencies();

      dependencies.notificationRepository.findOne.mockResolvedValue(null);

      await expect(markAsRead(dependencies, 7, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('marks every unread notification with the same timestamp', async () => {
      const dependencies = createDependencies();

      dependencies.notificationRepository.find.mockResolvedValue([
        createNotification({ id: 'notification-1', isRead: false }),
        createNotification({
          id: 'notification-2',
          resourceId: 'resource-2',
          isRead: false,
        }),
      ]);

      await markAllAsRead(dependencies, 7);

      expect(dependencies.notificationRepository.find).toHaveBeenCalledWith({
        where: {
          userId: 7,
          isRead: false,
        },
      });
      const savedNotifications = getSavedNotifications(dependencies);

      expect(savedNotifications).toHaveLength(2);
      expect(savedNotifications[0].readAt).toBe(savedNotifications[1].readAt);
    });

    it('returns early when there are no unread notifications', async () => {
      const dependencies = createDependencies();

      dependencies.notificationRepository.find.mockResolvedValue([]);

      await markAllAsRead(dependencies, 7);

      expect(dependencies.notificationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('clearAll', () => {
    it('clears all notifications for a user', async () => {
      const dependencies = createDependencies();

      await clearAll(dependencies, 42);

      expect(dependencies.notificationRepository.delete).toHaveBeenCalledWith({
        userId: 42,
      });
    });
  });
});
