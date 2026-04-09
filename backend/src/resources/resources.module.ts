import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { Resource } from '../entities/resource.entity';
import { User } from '../entities/user.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  imports: [TypeOrmModule.forFeature([Resource, User])],
  providers: [ResourcesService, AdminRoleGuard],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
