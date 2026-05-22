import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../entities/course.entity';
import { Chapter } from '../entities/chapter.entity';
import { SubChapter } from '../entities/sub-chapter.entity';
import { PedagogicalContent } from '../entities/pedagogical-content.entity';
import { Progress } from '../entities/progress.entity';
import { Favorite } from '../entities/favorite.entity';
import { Author } from '../entities/author.entity';
import { User } from '../entities/user.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { CertificateSignersModule } from '../certificate-signers/certificate-signers.module';
import { CourseService } from './services/course.service';
import { CourseController } from './controllers/course.controller';
import { ChapterService } from './services/chapters.service';
import { ChaptersController } from './controllers/chapters.controller';
import { SubChapterService } from './services/sub-chapters.service';
import { SubChaptersController } from './controllers/sub-chapters.controller';
import { PedagogicalContentService } from './services/pedagogical-contents.service';
import { PedagogicalContentsController } from './controllers/pedagogical-contents.controller';
import { ProgressService } from './services/progress.service';
import { ProgressController } from './controllers/progress.controller';
import { FavoriteService } from './services/favorite.service';
import { FavoriteController } from './controllers/favorite.controller';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { AdminOrCreatorRoleGuard } from '../auth/guards/admin-or-creator-role.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    CertificateSignersModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      Course,
      Chapter,
      SubChapter,
      PedagogicalContent,
      Progress,
      Favorite,
      Author,
      User,
      Quiz,
      QuizAttempt,
    ]),
  ],
  providers: [
    CourseService,
    ChapterService,
    SubChapterService,
    PedagogicalContentService,
    ProgressService,
    FavoriteService,
    AdminRoleGuard,
    AdminOrCreatorRoleGuard,
  ],
  controllers: [
    CourseController,
    ChaptersController,
    SubChaptersController,
    PedagogicalContentsController,
    ProgressController,
    FavoriteController,
  ],
  exports: [
    CourseService,
    ChapterService,
    SubChapterService,
    PedagogicalContentService,
    ProgressService,
    FavoriteService,
  ],
})
export class CoursesModule {}
