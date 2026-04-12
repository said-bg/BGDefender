import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';
import { Course, CourseLevel } from '../entities/course.entity';
import { Resource } from '../entities/resource.entity';
import { User, UserPlan, UserRole } from '../entities/user.entity';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const notificationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const userRepository = {
    find: jest.fn(),
  };

  const resourceRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    notificationRepository.create.mockImplementation(
      (value: Partial<Notification>) => value as Notification,
    );

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
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('lists notifications with an unread count', async () => {
    notificationRepository.find.mockResolvedValue([
      {
        id: 'notification-1',
        type: NotificationType.RESOURCE_SHARED,
        courseId: null,
        courseTitleEnSnapshot: null,
        courseTitleFiSnapshot: null,
        resourceId: 'resource-1',
        resourceTitleSnapshot: 'Security guide',
        link: '/resources',
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      },
    ]);
    notificationRepository.count.mockResolvedValue(1);
    resourceRepository.find.mockResolvedValue([{ id: 'resource-1' }]);

    const result = await service.listMyNotifications(7);

    expect(result.unreadCount).toBe(1);
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        type: NotificationType.RESOURCE_SHARED,
        resourceTitle: 'Security guide',
      }),
    );
  });

  it('creates course publication notifications for the right audience', async () => {
    userRepository.find.mockResolvedValue([
      {
        id: 3,
        role: UserRole.USER,
        plan: UserPlan.PREMIUM,
      },
      {
        id: 4,
        role: UserRole.CREATOR,
        plan: UserPlan.PREMIUM,
      },
    ]);

    await service.notifyCoursePublished({
      id: 'course-1',
      titleEn: 'Cloud Security',
      titleFi: 'Cloud Security',
      level: CourseLevel.PREMIUM,
    } as Course);

    expect(userRepository.find).toHaveBeenCalled();
    expect(notificationRepository.save).toHaveBeenCalledWith(
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

  it('deletes resource-shared notifications for a removed resource', async () => {
    await service.deleteResourceNotifications('resource-1');

    expect(notificationRepository.delete).toHaveBeenCalledWith({
      resourceId: 'resource-1',
      type: NotificationType.RESOURCE_SHARED,
    });
  });

  it('cleans orphaned resource notifications while listing', async () => {
    notificationRepository.find.mockResolvedValue([
      {
        id: 'notification-1',
        type: NotificationType.RESOURCE_SHARED,
        courseId: null,
        courseTitleEnSnapshot: null,
        courseTitleFiSnapshot: null,
        resourceId: 'resource-missing',
        resourceTitleSnapshot: 'Old guide',
        link: '/resources',
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      },
    ]);
    notificationRepository.count.mockResolvedValue(1);
    resourceRepository.find.mockResolvedValue([]);

    const result = await service.listMyNotifications(7);

    expect(notificationRepository.delete).toHaveBeenCalledWith([
      'notification-1',
    ]);
    expect(result.data).toEqual([]);
    expect(result.unreadCount).toBe(0);
  });
});
