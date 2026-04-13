import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Course, CourseLevel } from '../entities/course.entity';
import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';
import { Resource } from '../entities/resource.entity';
import { User, UserPlan, UserRole } from '../entities/user.entity';

type NotificationView = {
  id: string;
  type: NotificationType;
  courseId: string | null;
  courseTitleEn: string | null;
  courseTitleFi: string | null;
  resourceId: string | null;
  resourceTitle: string | null;
  link: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async listMyNotifications(
    userId: number,
    limit = 8,
  ): Promise<{ data: NotificationView[]; unreadCount: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 20);
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: safeLimit,
      }),
      this.notificationRepository.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);
    const cleanedNotifications = await this.removeOrphanedNotifications(
      notifications,
    );
    const cleanedUnreadCount = cleanedNotifications.filter(
      (notification) => !notification.isRead,
    ).length;

    return {
      data: cleanedNotifications.map((notification) =>
        this.toView(notification),
      ),
      unreadCount: Math.min(unreadCount, cleanedUnreadCount),
    };
  }

  async markAsRead(userId: number, notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
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
    await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    const unreadNotifications = await this.notificationRepository.find({
      where: {
        userId,
        isRead: false,
      },
    });

    if (unreadNotifications.length === 0) {
      return;
    }

    const readAt = new Date();

    for (const notification of unreadNotifications) {
      notification.isRead = true;
      notification.readAt = readAt;
    }

    await this.notificationRepository.save(unreadNotifications);
  }

  async clearAll(userId: number): Promise<void> {
    await this.notificationRepository.delete({ userId });
  }

  async notifyCoursePublished(course: Course): Promise<void> {
    const targetUsers = await this.userRepository.find({
      where:
        course.level === CourseLevel.PREMIUM
          ? [
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
            ]
          : [
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
            ],
    });

    if (targetUsers.length === 0) {
      return;
    }

    await this.notificationRepository.delete({
      courseId: course.id,
      type: NotificationType.COURSE_PUBLISHED,
    });

    const notifications = targetUsers.map((user) =>
      this.notificationRepository.create({
        userId: user.id,
        type: NotificationType.COURSE_PUBLISHED,
        courseId: course.id,
        courseTitleEnSnapshot: course.titleEn,
        courseTitleFiSnapshot: course.titleFi,
        resourceId: null,
        resourceTitleSnapshot: null,
        link: `/courses/${course.id}`,
        isRead: false,
        readAt: null,
      }),
    );

    await this.notificationRepository.save(notifications);
  }

  async notifyResourceShared(
    userId: number,
    resourceId: string,
    resourceTitle: string,
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.RESOURCE_SHARED,
      courseId: null,
      courseTitleEnSnapshot: null,
      courseTitleFiSnapshot: null,
      resourceId,
      resourceTitleSnapshot: resourceTitle,
      link: '/resources',
      isRead: false,
      readAt: null,
    });

    await this.notificationRepository.save(notification);
  }

  async deleteResourceNotifications(resourceId: string): Promise<void> {
    await this.notificationRepository.delete({
      resourceId,
      type: NotificationType.RESOURCE_SHARED,
    });
  }

  async deleteCourseNotifications(courseId: string): Promise<void> {
    await this.notificationRepository.delete({
      courseId,
    });
  }

  async notifyCertificateAvailable(
    userId: number,
    courseId: string,
    courseTitleEn: string,
    courseTitleFi: string,
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.CERTIFICATE_AVAILABLE,
      courseId,
      courseTitleEnSnapshot: courseTitleEn,
      courseTitleFiSnapshot: courseTitleFi,
      resourceId: null,
      resourceTitleSnapshot: null,
      link: '/certificates',
      isRead: false,
      readAt: null,
    });

    await this.notificationRepository.save(notification);
  }

  async notifyCompleteProfileForCertificate(
    userId: number,
    courseId: string,
    courseTitleEn: string,
    courseTitleFi: string,
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.COMPLETE_PROFILE_FOR_CERTIFICATE,
      courseId,
      courseTitleEnSnapshot: courseTitleEn,
      courseTitleFiSnapshot: courseTitleFi,
      resourceId: null,
      resourceTitleSnapshot: null,
      link: '/account',
      isRead: false,
      readAt: null,
    });

    await this.notificationRepository.save(notification);
  }

  private toView(notification: Notification): NotificationView {
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

  private async removeOrphanedNotifications(
    notifications: Notification[],
  ): Promise<Notification[]> {
    const validAfterResourceCleanup =
      await this.removeOrphanedResourceNotifications(notifications);

    return this.removeOrphanedCourseNotifications(validAfterResourceCleanup);
  }

  private async removeOrphanedResourceNotifications(
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

    const existingResources = await this.resourceRepository.find({
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

    await this.notificationRepository.delete(
      orphanedNotifications.map((notification) => notification.id),
    );

    const orphanedIds = new Set(
      orphanedNotifications.map((notification) => notification.id),
    );

    return notifications.filter(
      (notification) => !orphanedIds.has(notification.id),
    );
  }

  private async removeOrphanedCourseNotifications(
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

    const existingCourses = await this.courseRepository.find({
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

    await this.notificationRepository.delete(
      orphanedNotifications.map((notification) => notification.id),
    );

    const orphanedIds = new Set(
      orphanedNotifications.map((notification) => notification.id),
    );

    return notifications.filter(
      (notification) => !orphanedIds.has(notification.id),
    );
  }
}
