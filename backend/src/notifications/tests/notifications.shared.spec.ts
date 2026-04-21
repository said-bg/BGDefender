import { CourseLevel } from '../../entities/course.entity';
import { NotificationType } from '../../entities/notification.entity';
import {
  applyReadState,
  createNotification,
  getPublicationAudience,
  removeNotificationsById,
  toView,
} from '../services/notifications.shared';
import {
  createDependencies,
  createNotification as createNotificationEntity,
} from './notifications.test-helpers';

describe('notifications.shared', () => {
  it('creates a normalized notification entity draft', () => {
    const dependencies = createDependencies();

    const notification = createNotification(dependencies, {
      userId: 7,
      type: NotificationType.CERTIFICATE_AVAILABLE,
      courseId: 'course-1',
      courseTitleEnSnapshot: 'Cloud Security',
      courseTitleFiSnapshot: 'Cloud Security',
      link: '/certificates',
    });

    expect(notification).toEqual(
      expect.objectContaining({
        userId: 7,
        type: NotificationType.CERTIFICATE_AVAILABLE,
        courseId: 'course-1',
        resourceId: null,
        isRead: false,
        readAt: null,
      }),
    );
  });

  it('marks all provided notifications as read with the same timestamp', () => {
    const notifications = [
      createNotificationEntity({ id: 'notification-1', isRead: false }),
      createNotificationEntity({ id: 'notification-2', isRead: false }),
    ];
    const readAt = new Date('2026-01-05T00:00:00.000Z');

    applyReadState(notifications, readAt);

    expect(notifications[0]).toEqual(
      expect.objectContaining({
        isRead: true,
        readAt,
      }),
    );
    expect(notifications[1]).toEqual(
      expect.objectContaining({
        isRead: true,
        readAt,
      }),
    );
  });

  it('returns the premium publication audience', () => {
    expect(getPublicationAudience(CourseLevel.PREMIUM)).toEqual([
      {
        isActive: true,
        role: 'USER',
        plan: 'PREMIUM',
      },
      {
        isActive: true,
        role: 'CREATOR',
        plan: 'PREMIUM',
      },
    ]);
  });

  it('returns the free publication audience including premium users', () => {
    expect(getPublicationAudience(CourseLevel.FREE)).toEqual([
      {
        isActive: true,
        role: 'USER',
        plan: 'FREE',
      },
      {
        isActive: true,
        role: 'USER',
        plan: 'PREMIUM',
      },
      {
        isActive: true,
        role: 'CREATOR',
        plan: 'FREE',
      },
      {
        isActive: true,
        role: 'CREATOR',
        plan: 'PREMIUM',
      },
    ]);
  });

  it('maps a notification entity to the API view', () => {
    const notification = createNotificationEntity({
      id: 'notification-1',
      courseId: 'course-1',
      courseTitleEnSnapshot: 'Cloud Security',
      courseTitleFiSnapshot: 'Cloud Security',
      resourceId: null,
      resourceTitleSnapshot: null,
      link: '/courses/course-1',
    });

    expect(toView(notification)).toEqual({
      id: 'notification-1',
      type: NotificationType.RESOURCE_SHARED,
      courseId: 'course-1',
      courseTitleEn: 'Cloud Security',
      courseTitleFi: 'Cloud Security',
      resourceId: null,
      resourceTitle: null,
      link: '/courses/course-1',
      isRead: false,
      readAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('removes orphaned notifications by id and keeps the remaining ones', async () => {
    const dependencies = createDependencies();
    const notifications = [
      createNotificationEntity({ id: 'notification-1' }),
      createNotificationEntity({ id: 'notification-2' }),
    ];

    const result = await removeNotificationsById(dependencies, notifications, [
      notifications[0],
    ]);

    expect(dependencies.notificationRepository.delete).toHaveBeenCalledWith([
      'notification-1',
    ]);
    expect(result).toEqual([notifications[1]]);
  });
});
