import { CourseLevel } from '../../entities/course.entity';
import { Notification } from '../../entities/notification.entity';
import { UserPlan, UserRole } from '../../entities/user.entity';
import type { NotificationsServiceDependencies } from './notifications.service.dependencies';
import type {
  NotificationDraft,
  NotificationView,
} from './notifications.types';

export function createNotification(
  dependencies: NotificationsServiceDependencies,
  draft: NotificationDraft,
): Notification {
  return dependencies.notificationRepository.create({
    userId: draft.userId,
    type: draft.type,
    courseId: draft.courseId ?? null,
    courseTitleEnSnapshot: draft.courseTitleEnSnapshot ?? null,
    courseTitleFiSnapshot: draft.courseTitleFiSnapshot ?? null,
    resourceId: draft.resourceId ?? null,
    resourceTitleSnapshot: draft.resourceTitleSnapshot ?? null,
    link: draft.link,
    isRead: false,
    readAt: null,
  });
}

export function applyReadState(
  notifications: Notification[],
  readAt: Date,
): void {
  for (const notification of notifications) {
    notification.isRead = true;
    notification.readAt = readAt;
  }
}

export function getPublicationAudience(courseLevel: CourseLevel): {
  isActive: true;
  role: UserRole;
  plan: UserPlan;
}[] {
  if (courseLevel === CourseLevel.PREMIUM) {
    return [
      {
        isActive: true,
        role: UserRole.USER,
        plan: UserPlan.PREMIUM,
      },
      {
        isActive: true,
        role: UserRole.CREATOR,
        plan: UserPlan.PREMIUM,
      },
    ];
  }

  return [
    {
      isActive: true,
      role: UserRole.USER,
      plan: UserPlan.FREE,
    },
    {
      isActive: true,
      role: UserRole.USER,
      plan: UserPlan.PREMIUM,
    },
    {
      isActive: true,
      role: UserRole.CREATOR,
      plan: UserPlan.FREE,
    },
    {
      isActive: true,
      role: UserRole.CREATOR,
      plan: UserPlan.PREMIUM,
    },
  ];
}

export function toView(notification: Notification): NotificationView {
  return {
    id: notification.id,
    type: notification.type,
    courseId: notification.courseId,
    courseTitleEn: notification.courseTitleEnSnapshot,
    courseTitleFi: notification.courseTitleFiSnapshot,
    resourceId: notification.resourceId,
    resourceTitle: notification.resourceTitleSnapshot,
    link: notification.link,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

export async function removeNotificationsById(
  dependencies: NotificationsServiceDependencies,
  notifications: Notification[],
  notificationsToRemove: Notification[],
): Promise<Notification[]> {
  const notificationIds = notificationsToRemove.map(
    (notification) => notification.id,
  );

  await dependencies.notificationRepository.delete(notificationIds);

  const orphanedIds = new Set(notificationIds);

  return notifications.filter(
    (notification) => !orphanedIds.has(notification.id),
  );
}
