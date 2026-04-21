import type { Repository } from 'typeorm';
import { Course } from '../../entities/course.entity';
import { Notification } from '../../entities/notification.entity';
import { Resource } from '../../entities/resource.entity';
import { User } from '../../entities/user.entity';

export type NotificationsServiceDependencies = {
  notificationRepository: Repository<Notification>;
  userRepository: Repository<User>;
  resourceRepository: Repository<Resource>;
  courseRepository: Repository<Course>;
};
