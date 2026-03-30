import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../entities/course.entity';
import { Chapter } from '../entities/chapter.entity';
import { SubChapter } from '../entities/sub-chapter.entity';
import { PedagogicalContent } from '../entities/pedagogical-content.entity';
import { Progress } from '../entities/progress.entity';
import { Author } from '../entities/author.entity';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Chapter,
      SubChapter,
      PedagogicalContent,
      Progress,
      Author,
    ]),
  ],
  providers: [
    CourseService,
    ChapterService,
    SubChapterService,
    PedagogicalContentService,
    ProgressService,
  ],
  controllers: [
    CourseController,
    ChaptersController,
    SubChaptersController,
    PedagogicalContentsController,
    ProgressController,
  ],
  exports: [
    CourseService,
    ChapterService,
    SubChapterService,
    PedagogicalContentService,
    ProgressService,
  ],
})
export class CoursesModule {}
