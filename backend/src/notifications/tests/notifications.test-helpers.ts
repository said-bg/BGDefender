import { Course, CourseLevel } from '../../entities/course.entity';
import {
  Notification,
  NotificationType,
} from '../../entities/notification.entity';
import { User, UserPlan, UserRole } from '../../entities/user.entity';
import type { NotificationsServiceDependencies } from '../services/notifications.service.dependencies';

export type SaveNotificationArg = Notification | Notification[];

type MockNotificationRepository = {
  find: jest.Mock;
  findOne: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  save: jest.Mock<Promise<SaveNotificationArg>, [SaveNotificationArg]>;
  delete: jest.Mock;
};

type MockUserRepository = {
  find: jest.Mock;
};

type MockResourceRepository = {
  find: jest.Mock;
};

type MockCourseRepository = {
  find: jest.Mock;
};

export type MockNotificationsDependencies = NotificationsServiceDependencies & {
  notificationRepository: MockNotificationRepository;
  userRepository: MockUserRepository;
  resourceRepository: MockResourceRepository;
  courseRepository: MockCourseRepository;
};

export const createNotification = (
  overrides: Partial<Notification> = {},
): Notification =>
  ({
    id: 'notification-1',
    userId: 7,
    type: NotificationType.RESOURCE_SHARED,
    courseId: null,
    courseTitleEnSnapshot: null,
    courseTitleFiSnapshot: null,
    resourceId: 'resource-1',
    resourceTitleSnapshot: 'Security guide',
    link: '/resources',
    isRead: false,
    readAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }) as Notification;

export const createUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 3,
    email: 'user@example.com',
    firstName: 'User',
    lastName: 'Example',
    occupation: null,
    password: 'hashed',
    role: UserRole.USER,
    plan: UserPlan.FREE,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }) as User;

export const createCourse = (overrides: Partial<Course> = {}): Course =>
  ({
    id: 'course-1',
    titleEn: 'Cloud Security',
    titleFi: 'Cloud Security',
    descriptionEn: 'desc',
    descriptionFi: 'desc',
    level: CourseLevel.FREE,
    authors: [],
    chapters: [],
    finalTests: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }) as Course;

export const createDependencies = (): MockNotificationsDependencies => {
  const notificationRepository: MockNotificationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn<Promise<SaveNotificationArg>, [SaveNotificationArg]>(),
    delete: jest.fn(),
  };

  const userRepository: MockUserRepository = {
    find: jest.fn(),
  };

  const resourceRepository: MockResourceRepository = {
    find: jest.fn(),
  };

  const courseRepository: MockCourseRepository = {
    find: jest.fn(),
  };

  notificationRepository.create.mockImplementation(
    (value: Partial<Notification>) => value as Notification,
  );
  notificationRepository.save.mockImplementation((value: SaveNotificationArg) =>
    Promise.resolve(value),
  );

  return {
    notificationRepository: notificationRepository as never,
    userRepository: userRepository as never,
    resourceRepository: resourceRepository as never,
    courseRepository: courseRepository as never,
  };
};

export const getSavedNotification = (
  dependencies: MockNotificationsDependencies,
): Notification => {
  expect(dependencies.notificationRepository.save).toHaveBeenCalledTimes(1);
  return dependencies.notificationRepository.save.mock
    .calls[0][0] as Notification;
};

export const getSavedNotifications = (
  dependencies: MockNotificationsDependencies,
): Notification[] => {
  expect(dependencies.notificationRepository.save).toHaveBeenCalledTimes(1);
  return dependencies.notificationRepository.save.mock
    .calls[0][0] as Notification[];
};
