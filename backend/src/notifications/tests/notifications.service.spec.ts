import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Course } from '../../entities/course.entity';
import { Notification } from '../../entities/notification.entity';
import { Resource } from '../../entities/resource.entity';
import { User } from '../../entities/user.entity';
import { NotificationsService } from '../services/notifications.service';
import {
  clearAll,
  listMyNotifications,
  markAllAsRead,
  markAsRead,
} from '../services/notifications.readers';
import {
  deleteCourseNotifications,
  deleteResourceNotifications,
  notifyCertificateAvailable,
  notifyCompleteProfileForCertificate,
  notifyCoursePublished,
  notifyResourceShared,
} from '../services/notifications.writers';
import { createCourse } from './notifications.test-helpers';

jest.mock('../services/notifications.readers', () => ({
  listMyNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  clearAll: jest.fn(),
}));

jest.mock('../services/notifications.writers', () => ({
  notifyCoursePublished: jest.fn(),
  notifyResourceShared: jest.fn(),
  deleteResourceNotifications: jest.fn(),
  deleteCourseNotifications: jest.fn(),
  notifyCertificateAvailable: jest.fn(),
  notifyCompleteProfileForCertificate: jest.fn(),
}));

describe('NotificationsService facade', () => {
  let service: NotificationsService;

  const notificationRepository = { find: jest.fn() };
  const userRepository = { find: jest.fn() };
  const resourceRepository = { find: jest.fn() };
  const courseRepository = { find: jest.fn() };

  const mockedListMyNotifications = jest.mocked(listMyNotifications);
  const mockedMarkAsRead = jest.mocked(markAsRead);
  const mockedMarkAllAsRead = jest.mocked(markAllAsRead);
  const mockedClearAll = jest.mocked(clearAll);
  const mockedNotifyCoursePublished = jest.mocked(notifyCoursePublished);
  const mockedNotifyResourceShared = jest.mocked(notifyResourceShared);
  const mockedDeleteResourceNotifications = jest.mocked(
    deleteResourceNotifications,
  );
  const mockedDeleteCourseNotifications = jest.mocked(
    deleteCourseNotifications,
  );
  const mockedNotifyCertificateAvailable = jest.mocked(
    notifyCertificateAvailable,
  );
  const mockedNotifyCompleteProfileForCertificate = jest.mocked(
    notifyCompleteProfileForCertificate,
  );

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedListMyNotifications.mockResolvedValue({
      data: [],
      unreadCount: 0,
    });
    mockedMarkAsRead.mockResolvedValue(undefined);
    mockedMarkAllAsRead.mockResolvedValue(undefined);
    mockedClearAll.mockResolvedValue(undefined);
    mockedNotifyCoursePublished.mockResolvedValue(undefined);
    mockedNotifyResourceShared.mockResolvedValue(undefined);
    mockedDeleteResourceNotifications.mockResolvedValue(undefined);
    mockedDeleteCourseNotifications.mockResolvedValue(undefined);
    mockedNotifyCertificateAvailable.mockResolvedValue(undefined);
    mockedNotifyCompleteProfileForCertificate.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Resource),
          useValue: resourceRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('delegates notification listing to readers', async () => {
    await service.listMyNotifications(7, 12);

    expect(mockedListMyNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationRepository,
        userRepository,
        resourceRepository,
        courseRepository,
      }),
      7,
      12,
    );
  });

  it('delegates single notification reads to readers', async () => {
    await service.markAsRead(7, 'notification-1');

    expect(mockedMarkAsRead).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationRepository,
      }),
      7,
      'notification-1',
    );
  });

  it('delegates bulk notification reads to readers', async () => {
    await service.markAllAsRead(7);

    expect(mockedMarkAllAsRead).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationRepository,
      }),
      7,
    );
  });

  it('delegates notification cleanup to readers', async () => {
    await service.clearAll(42);

    expect(mockedClearAll).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationRepository,
      }),
      42,
    );
  });

  it('delegates course publication notifications to writers', async () => {
    const course = createCourse();

    await service.notifyCoursePublished(course);

    expect(mockedNotifyCoursePublished).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationRepository,
        userRepository,
      }),
      course,
    );
  });

  it('delegates resource notifications to writers', async () => {
    await service.notifyResourceShared(7, 'resource-1', 'Security guide');

    expect(mockedNotifyResourceShared).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationRepository,
      }),
      7,
      'resource-1',
      'Security guide',
    );
  });

  it('delegates resource notification deletion to writers', async () => {
    await service.deleteResourceNotifications('resource-1');

    expect(mockedDeleteResourceNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationRepository,
      }),
      'resource-1',
    );
  });

  it('delegates course notification deletion to writers', async () => {
    await service.deleteCourseNotifications('course-1');

    expect(mockedDeleteCourseNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationRepository,
      }),
      'course-1',
    );
  });

  it('delegates certificate available notifications to writers', async () => {
    await service.notifyCertificateAvailable(
      7,
      'course-1',
      'Cloud Security',
      'Cloud Security',
    );

    expect(mockedNotifyCertificateAvailable).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationRepository,
      }),
      7,
      'course-1',
      'Cloud Security',
      'Cloud Security',
    );
  });

  it('delegates complete-profile notifications to writers', async () => {
    await service.notifyCompleteProfileForCertificate(
      7,
      'course-1',
      'Cloud Security',
      'Cloud Security',
    );

    expect(mockedNotifyCompleteProfileForCertificate).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationRepository,
      }),
      7,
      'course-1',
      'Cloud Security',
      'Cloud Security',
    );
  });
});
