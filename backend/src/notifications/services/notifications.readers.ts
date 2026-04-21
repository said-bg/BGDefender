import { NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../../entities/notification.entity';
import type { NotificationsServiceDependencies } from './notifications.service.dependencies';
import {
  applyReadState,
  removeNotificationsById,
  toView,
} from './notifications.shared';
import type { NotificationView } from './notifications.types';

export async function listMyNotifications(
  dependencies: NotificationsServiceDependencies,
  userId: number,
  limit = 8,
): Promise<{ data: NotificationView[]; unreadCount: number }> {
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const [notifications, unreadCount] = await Promise.all([
    dependencies.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
    }),
    dependencies.notificationRepository.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);
  const cleanedNotifications = await removeOrphanedNotifications(
    dependencies,
    notifications,
  );
  const cleanedUnreadCount = cleanedNotifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return {
    data: cleanedNotifications.map((notification) => toView(notification)),
    unreadCount: Math.min(unreadCount, cleanedUnreadCount),
  };
}

export async function markAsRead(
  dependencies: NotificationsServiceDependencies,
  userId: number,
  notificationId: string,
): Promise<void> {
  const notification = await dependencies.notificationRepository.findOne({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new NotFoundException('Notification not found');
  }

  if (notification.isRead) {
    return;
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await dependencies.notificationRepository.save(notification);
}

export async function markAllAsRead(
  dependencies: NotificationsServiceDependencies,
  userId: number,
): Promise<void> {
  const unreadNotifications = await dependencies.notificationRepository.find({
    where: {
      userId,
      isRead: false,
    },
  });

  if (unreadNotifications.length === 0) {
    return;
  }

  applyReadState(unreadNotifications, new Date());

  await dependencies.notificationRepository.save(unreadNotifications);
}

export async function clearAll(
  dependencies: NotificationsServiceDependencies,
  userId: number,
): Promise<void> {
  await dependencies.notificationRepository.delete({ userId });
}

async function removeOrphanedNotifications(
  dependencies: NotificationsServiceDependencies,
  notifications: Notification[],
): Promise<Notification[]> {
  const validAfterResourceCleanup = await removeOrphanedResourceNotifications(
    dependencies,
    notifications,
  );

  return removeOrphanedCourseNotifications(
    dependencies,
    validAfterResourceCleanup,
  );
}

async function removeOrphanedResourceNotifications(
  dependencies: NotificationsServiceDependencies,
  notifications: Notification[],
): Promise<Notification[]> {
  const resourceNotifications = notifications.filter(
    (notification) =>
      notification.type === NotificationType.RESOURCE_SHARED &&
      Boolean(notification.resourceId),
  );

  if (resourceNotifications.length === 0) {
    return notifications;
  }

  const resourceIds = resourceNotifications
    .map((notification) => notification.resourceId)
    .filter((resourceId): resourceId is string => Boolean(resourceId));

  const existingResources = await dependencies.resourceRepository.find({
    where: {
      id: In(resourceIds),
    },
    select: {
      id: true,
    },
  });
  const existingResourceIds = new Set(
    existingResources.map((resource) => resource.id),
  );
  const orphanedNotifications = resourceNotifications.filter(
    (notification) =>
      notification.resourceId &&
      !existingResourceIds.has(notification.resourceId),
  );

  if (orphanedNotifications.length === 0) {
    return notifications;
  }

  return removeNotificationsById(
    dependencies,
    notifications,
    orphanedNotifications,
  );
}

async function removeOrphanedCourseNotifications(
  dependencies: NotificationsServiceDependencies,
  notifications: Notification[],
): Promise<Notification[]> {
  const courseNotifications = notifications.filter((notification) =>
    Boolean(notification.courseId),
  );

  if (courseNotifications.length === 0) {
    return notifications;
  }

  const courseIds = courseNotifications
    .map((notification) => notification.courseId)
    .filter((courseId): courseId is string => Boolean(courseId));

  const existingCourses = await dependencies.courseRepository.find({
    where: {
      id: In(courseIds),
    },
    select: {
      id: true,
    },
  });
  const existingCourseIds = new Set(existingCourses.map((course) => course.id));
  const orphanedNotifications = courseNotifications.filter(
    (notification) =>
      notification.courseId && !existingCourseIds.has(notification.courseId),
  );

  if (orphanedNotifications.length === 0) {
    return notifications;
  }

  return removeNotificationsById(
    dependencies,
    notifications,
    orphanedNotifications,
  );
}
