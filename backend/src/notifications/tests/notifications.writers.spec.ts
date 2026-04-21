import { NotificationType } from '../../entities/notification.entity';
import { CourseLevel } from '../../entities/course.entity';
import { UserPlan, UserRole } from '../../entities/user.entity';
import {
  deleteCourseNotifications,
  deleteResourceNotifications,
  notifyCertificateAvailable,
  notifyCompleteProfileForCertificate,
  notifyCoursePublished,
  notifyResourceShared,
} from '../services/notifications.writers';
import {
  createCourse,
  createDependencies,
  createUser,
} from './notifications.test-helpers';

describe('notifications.writers', () => {
  describe('notifyCoursePublished', () => {
    it('creates course publication notifications for the premium audience', async () => {
      const dependencies = createDependencies();

      dependencies.userRepository.find.mockResolvedValue([
        createUser({
          id: 3,
          plan: UserPlan.PREMIUM,
        }),
        createUser({
          id: 4,
          role: UserRole.CREATOR,
          plan: UserPlan.PREMIUM,
        }),
      ]);

      await notifyCoursePublished(
        dependencies,
        createCourse({
          id: 'course-1',
          level: CourseLevel.PREMIUM,
        }),
      );

      expect(dependencies.userRepository.find).toHaveBeenCalledWith({
        where: [
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
        ],
      });
      expect(dependencies.notificationRepository.delete).toHaveBeenCalledWith({
        courseId: 'course-1',
        type: NotificationType.COURSE_PUBLISHED,
      });
      expect(dependencies.notificationRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: 3,
            type: NotificationType.COURSE_PUBLISHED,
            link: '/courses/course-1',
          }),
          expect.objectContaining({
            userId: 4,
            type: NotificationType.COURSE_PUBLISHED,
            link: '/courses/course-1',
          }),
        ]),
      );
    });

    it('creates course publication notifications for the free and premium audience on free courses', async () => {
      const dependencies = createDependencies();

      dependencies.userRepository.find.mockResolvedValue([
        createUser({
          id: 3,
        }),
      ]);

      await notifyCoursePublished(
        dependencies,
        createCourse({
          id: 'course-1',
          level: CourseLevel.FREE,
        }),
      );

      expect(dependencies.userRepository.find).toHaveBeenCalledWith({
        where: [
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
        ],
      });
    });

    it('returns early when there are no target users', async () => {
      const dependencies = createDependencies();

      dependencies.userRepository.find.mockResolvedValue([]);

      await notifyCoursePublished(dependencies, createCourse());

      expect(dependencies.notificationRepository.delete).not.toHaveBeenCalled();
      expect(dependencies.notificationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('notification creators', () => {
    it('creates a resource shared notification', async () => {
      const dependencies = createDependencies();

      await notifyResourceShared(
        dependencies,
        7,
        'resource-1',
        'Security guide',
      );

      expect(dependencies.notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          type: NotificationType.RESOURCE_SHARED,
          resourceId: 'resource-1',
          resourceTitleSnapshot: 'Security guide',
          link: '/resources',
        }),
      );
    });

    it('creates a certificate available notification', async () => {
      const dependencies = createDependencies();

      await notifyCertificateAvailable(
        dependencies,
        7,
        'course-1',
        'Cloud Security',
        'Cloud Security',
      );

      expect(dependencies.notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          type: NotificationType.CERTIFICATE_AVAILABLE,
          courseId: 'course-1',
          link: '/certificates',
        }),
      );
    });

    it('creates a complete profile notification for certificate access', async () => {
      const dependencies = createDependencies();

      await notifyCompleteProfileForCertificate(
        dependencies,
        7,
        'course-1',
        'Cloud Security',
        'Cloud Security',
      );

      expect(dependencies.notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          type: NotificationType.COMPLETE_PROFILE_FOR_CERTIFICATE,
          courseId: 'course-1',
          link: '/account',
        }),
      );
    });
  });

  describe('notification cleanup helpers', () => {
    it('deletes resource-shared notifications for a removed resource', async () => {
      const dependencies = createDependencies();

      await deleteResourceNotifications(dependencies, 'resource-1');

      expect(dependencies.notificationRepository.delete).toHaveBeenCalledWith({
        resourceId: 'resource-1',
        type: NotificationType.RESOURCE_SHARED,
      });
    });

    it('deletes course-linked notifications for a removed course', async () => {
      const dependencies = createDependencies();

      await deleteCourseNotifications(dependencies, 'course-1');

      expect(dependencies.notificationRepository.delete).toHaveBeenCalledWith({
        courseId: 'course-1',
      });
    });
  });
});
