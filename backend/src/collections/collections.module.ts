import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { CourseCollection } from '../entities/course-collection.entity';
import { CourseCollectionItem } from '../entities/course-collection-item.entity';
import { Course } from '../entities/course.entity';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseCollection, CourseCollectionItem, Course]),
  ],
  providers: [CollectionsService, AdminRoleGuard],
  controllers: [CollectionsController],
  exports: [CollectionsService],
})
export class CollectionsModule {}
