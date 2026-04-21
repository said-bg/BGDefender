import { Course } from '../../entities/course.entity';
import { NotificationType } from '../../entities/notification.entity';
import type { NotificationsServiceDependencies } from './notifications.service.dependencies';
import {
  createNotification,
  getPublicationAudience,
} from './notifications.shared';

export async function notifyCoursePublished(
  dependencies: NotificationsServiceDependencies,
  course: Course,
): Promise<void> {
  const targetUsers = await dependencies.userRepository.find({
    where: getPublicationAudience(course.level),
  });

  if (targetUsers.length === 0) {
    return;
  }

  await dependencies.notificationRepository.delete({
    courseId: course.id,
    type: NotificationType.COURSE_PUBLISHED,
  });

  const notifications = targetUsers.map((user) =>
    createNotification(dependencies, {
      userId: user.id,
      type: NotificationType.COURSE_PUBLISHED,
      courseId: course.id,
      courseTitleEnSnapshot: course.titleEn,
      courseTitleFiSnapshot: course.titleFi,
      link: `/courses/${course.id}`,
    }),
  );

  await dependencies.notificationRepository.save(notifications);
}

export async function notifyResourceShared(
  dependencies: NotificationsServiceDependencies,
  userId: number,
  resourceId: string,
  resourceTitle: string,
): Promise<void> {
  const notification = createNotification(dependencies, {
    userId,
    type: NotificationType.RESOURCE_SHARED,
    resourceId,
    resourceTitleSnapshot: resourceTitle,
    link: '/resources',
  });

  await dependencies.notificationRepository.save(notification);
}

export async function deleteResourceNotifications(
  dependencies: NotificationsServiceDependencies,
  resourceId: string,
): Promise<void> {
  await dependencies.notificationRepository.delete({
    resourceId,
    type: NotificationType.RESOURCE_SHARED,
  });
}

export async function deleteCourseNotifications(
  dependencies: NotificationsServiceDependencies,
  courseId: string,
): Promise<void> {
  await dependencies.notificationRepository.delete({
    courseId,
  });
}

export async function notifyCertificateAvailable(
  dependencies: NotificationsServiceDependencies,
  userId: number,
  courseId: string,
  courseTitleEn: string,
  courseTitleFi: string,
): Promise<void> {
  const notification = createNotification(dependencies, {
    userId,
    type: NotificationType.CERTIFICATE_AVAILABLE,
    courseId,
    courseTitleEnSnapshot: courseTitleEn,
    courseTitleFiSnapshot: courseTitleFi,
    link: '/certificates',
  });

  await dependencies.notificationRepository.save(notification);
}

export async function notifyCompleteProfileForCertificate(
  dependencies: NotificationsServiceDependencies,
  userId: number,
  courseId: string,
  courseTitleEn: string,
  courseTitleFi: string,
): Promise<void> {
  const notification = createNotification(dependencies, {
    userId,
    type: NotificationType.COMPLETE_PROFILE_FOR_CERTIFICATE,
    courseId,
    courseTitleEnSnapshot: courseTitleEn,
    courseTitleFiSnapshot: courseTitleFi,
    link: '/account',
  });

  await dependencies.notificationRepository.save(notification);
}
