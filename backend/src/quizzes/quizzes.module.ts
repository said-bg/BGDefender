import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { Chapter } from '../entities/chapter.entity';
import { Course } from '../entities/course.entity';
import { Progress } from '../entities/progress.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { QuizAttemptAnswer } from '../entities/quiz-attempt-answer.entity';
import { QuizOption } from '../entities/quiz-option.entity';
import { QuizQuestion } from '../entities/quiz-question.entity';
import { FinalTestsController } from './final-tests.controller';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chapter,
      Course,
      Progress,
      Quiz,
      QuizQuestion,
      QuizOption,
      QuizAttempt,
      QuizAttemptAnswer,
    ]),
  ],
  providers: [QuizzesService, AdminRoleGuard],
  controllers: [QuizzesController, FinalTestsController],
  exports: [QuizzesService],
})
export class QuizzesModule {}
