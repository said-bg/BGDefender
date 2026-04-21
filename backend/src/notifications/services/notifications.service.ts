import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../entities/course.entity';
import { Notification } from '../../entities/notification.entity';
import { Resource } from '../../entities/resource.entity';
import { User } from '../../entities/user.entity';
import {
  clearAll,
  listMyNotifications,
  markAllAsRead,
  markAsRead,
} from './notifications.readers';
import type { NotificationsServiceDependencies } from './notifications.service.dependencies';
import type { NotificationView } from './notifications.types';
import {
  deleteCourseNotifications,
  deleteResourceNotifications,
  notifyCertificateAvailable,
  notifyCompleteProfileForCertificate,
  notifyCoursePublished,
  notifyResourceShared,
} from './notifications.writers';

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

  private get dependencies(): NotificationsServiceDependencies {
    return {
      notificationRepository: this.notificationRepository,
      userRepository: this.userRepository,
      resourceRepository: this.resourceRepository,
      courseRepository: this.courseRepository,
    };
  }

  async listMyNotifications(
    userId: number,
    limit = 8,
  ): Promise<{ data: NotificationView[]; unreadCount: number }> {
    return listMyNotifications(this.dependencies, userId, limit);
  }

  async markAsRead(userId: number, notificationId: string): Promise<void> {
    return markAsRead(this.dependencies, userId, notificationId);
  }

  async markAllAsRead(userId: number): Promise<void> {
    return markAllAsRead(this.dependencies, userId);
  }

  async clearAll(userId: number): Promise<void> {
    return clearAll(this.dependencies, userId);
  }

  async notifyCoursePublished(course: Course): Promise<void> {
    return notifyCoursePublished(this.dependencies, course);
  }

  async notifyResourceShared(
    userId: number,
    resourceId: string,
    resourceTitle: string,
  ): Promise<void> {
    return notifyResourceShared(
      this.dependencies,
      userId,
      resourceId,
      resourceTitle,
    );
  }

  async deleteResourceNotifications(resourceId: string): Promise<void> {
    return deleteResourceNotifications(this.dependencies, resourceId);
  }

  async deleteCourseNotifications(courseId: string): Promise<void> {
    return deleteCourseNotifications(this.dependencies, courseId);
  }

  async notifyCertificateAvailable(
    userId: number,
    courseId: string,
    courseTitleEn: string,
    courseTitleFi: string,
  ): Promise<void> {
    return notifyCertificateAvailable(
      this.dependencies,
      userId,
      courseId,
      courseTitleEn,
      courseTitleFi,
    );
  }

  async notifyCompleteProfileForCertificate(
    userId: number,
    courseId: string,
    courseTitleEn: string,
    courseTitleFi: string,
  ): Promise<void> {
    return notifyCompleteProfileForCertificate(
      this.dependencies,
      userId,
      courseId,
      courseTitleEn,
      courseTitleFi,
    );
  }
}
