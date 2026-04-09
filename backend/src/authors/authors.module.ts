import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Author } from '../entities/author.entity';
import { AuthorService } from './services/author.service';
import { AuthorController } from './controllers/author.controller';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Author])],
  providers: [AuthorService, AdminRoleGuard],
  controllers: [AuthorController],
  exports: [AuthorService],
})
export class AuthorsModule {}
