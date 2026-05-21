import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { ResourceGroup } from '../entities/resource-group.entity';
import { ResourceGroupMember } from '../entities/resource-group-member.entity';
import { Resource } from '../entities/resource.entity';
import { User } from '../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ResourcesController } from './controllers/resources.controller';
import { ResourcesService } from './services/resources.service';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([Resource, ResourceGroup, ResourceGroupMember, User]),
  ],
  providers: [ResourcesService, AdminRoleGuard],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}
