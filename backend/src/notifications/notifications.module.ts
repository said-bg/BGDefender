import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../entities/course.entity';
import { Notification } from '../entities/notification.entity';
import { Resource } from '../entities/resource.entity';
import { User } from '../entities/user.entity';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Resource, Course])],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
