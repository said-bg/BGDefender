import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { Author } from '../entities/author.entity';
import { Course } from '../entities/course.entity';
import { Chapter } from '../entities/chapter.entity';
import { SubChapter } from '../entities/sub-chapter.entity';
import { PedagogicalContent } from '../entities/pedagogical-content.entity';
import { Progress } from '../entities/progress.entity';
import { Favorite } from '../entities/favorite.entity';
import { Resource } from '../entities/resource.entity';
import { Certificate } from '../entities/certificate.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizQuestion } from '../entities/quiz-question.entity';
import { QuizOption } from '../entities/quiz-option.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { QuizAttemptAnswer } from '../entities/quiz-attempt-answer.entity';
import { Notification } from '../entities/notification.entity';
import { CourseCollection } from '../entities/course-collection.entity';
import { CourseCollectionItem } from '../entities/course-collection-item.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isDev = this.configService.get('NODE_ENV') !== 'production';
    const enableDatabaseLogging =
      this.configService.get('DATABASE_LOGGING') === 'true';

    return {
      type: 'mysql',
      host: this.configService.get('DATABASE_HOST') || 'localhost',
      port: this.configService.get('DATABASE_PORT') || 3306,
      username: this.configService.getOrThrow('DATABASE_USERNAME'),
      password: this.configService.getOrThrow('DATABASE_PASSWORD'),
      database: this.configService.getOrThrow('DATABASE_NAME'),
      entities: [
        User,
        PasswordResetToken,
        Author,
        Course,
        Chapter,
        SubChapter,
        PedagogicalContent,
        Progress,
        Favorite,
        Resource,
        Certificate,
        Quiz,
        QuizQuestion,
        QuizOption,
        QuizAttempt,
        QuizAttemptAnswer,
        Notification,
        CourseCollection,
        CourseCollectionItem,
      ],
      synchronize: isDev,
      logging: enableDatabaseLogging,
    };
  }
}
