import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SafeUser } from '../../auth/types/safe-user.type';
import type { AppLanguage } from '../../config/request-language';
import { Chapter } from '../../entities/chapter.entity';
import { Course } from '../../entities/course.entity';
import { Progress } from '../../entities/progress.entity';
import { Quiz } from '../../entities/quiz.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import { QuizAttemptAnswer } from '../../entities/quiz-attempt-answer.entity';
import { QuizOption } from '../../entities/quiz-option.entity';
import { QuizQuestion } from '../../entities/quiz-question.entity';
import { QuizScope } from '../../entities/quiz-scope.enum';
import { UserRole } from '../../entities/user.entity';
import { CertificatesService } from '../../certificates/services/certificates.service';
import { SubmitChapterQuizAttemptDto } from '../dto/submit-chapter-quiz-attempt.dto';
import { UpsertChapterQuizDto } from '../dto/upsert-chapter-quiz.dto';
import {
  getCourseFinalTestAnalyticsForAdmin,
  getChapterQuizAnalyticsForAdmin,
  getChapterQuizForAdmin,
  getChapterQuizForLearner,
  getCourseFinalTestForAdmin,
  getCourseFinalTestForLearner,
} from './quizzes.readers';
import type { QuizzesServiceDependencies } from './quizzes.service.dependencies';
import { findChapterOrFail, findCourseOrFail } from './quizzes.shared';
import {
  AdminFinalTestAnalyticsView,
  AdminQuizAnalyticsView,
  AdminFinalTestView,
  AdminQuizView,
  LearnerFinalTestView,
  LearnerQuizView,
  SubmitQuizAttemptResult,
} from './quizzes.types';
import {
  submitChapterQuizAttempt,
  submitCourseFinalTestAttempt,
} from './quizzes.attempts';
import { upsertQuizDefinition } from './quizzes.writers';
import { validateQuizPayload } from './quizzes.utils';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestionRepository: Repository<QuizQuestion>,
    @InjectRepository(QuizOption)
    private readonly quizOptionRepository: Repository<QuizOption>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(QuizAttemptAnswer)
    private readonly quizAttemptAnswerRepository: Repository<QuizAttemptAnswer>,
    private readonly certificatesService: CertificatesService,
  ) {}

  private get dependencies(): QuizzesServiceDependencies {
    return {
      chapterRepository: this.chapterRepository,
      courseRepository: this.courseRepository,
      progressRepository: this.progressRepository,
      quizRepository: this.quizRepository,
      quizQuestionRepository: this.quizQuestionRepository,
      quizOptionRepository: this.quizOptionRepository,
      quizAttemptRepository: this.quizAttemptRepository,
      quizAttemptAnswerRepository: this.quizAttemptAnswerRepository,
      certificatesService: this.certificatesService,
    };
  }

  async getChapterQuiz(
    courseId: string,
    chapterId: string,
    currentUser: SafeUser,
    forceLearnerView = false,
  ): Promise<AdminQuizView | LearnerQuizView | null> {
    await findChapterOrFail(this.dependencies, courseId, chapterId);

    if (currentUser.role === UserRole.ADMIN && !forceLearnerView) {
      return getChapterQuizForAdmin(this.dependencies, chapterId);
    }
    return getChapterQuizForLearner(
      this.dependencies,
      chapterId,
      currentUser.id,
    );
  }

  async getChapterQuizAnalytics(
    courseId: string,
    chapterId: string,
  ): Promise<AdminQuizAnalyticsView | null> {
    await findChapterOrFail(this.dependencies, courseId, chapterId);
    return getChapterQuizAnalyticsForAdmin(this.dependencies, chapterId);
  }

  async getCourseFinalTest(
    courseId: string,
    currentUser: SafeUser,
    forceLearnerView = false,
  ): Promise<AdminFinalTestView | LearnerFinalTestView | null> {
    await findCourseOrFail(this.dependencies, courseId);

    if (currentUser.role === UserRole.ADMIN && !forceLearnerView) {
      return getCourseFinalTestForAdmin(this.dependencies, courseId);
    }
    return getCourseFinalTestForLearner(
      this.dependencies,
      courseId,
      currentUser.id,
    );
  }

  async getCourseFinalTestAnalytics(
    courseId: string,
  ): Promise<AdminFinalTestAnalyticsView | null> {
    await findCourseOrFail(this.dependencies, courseId);
    return getCourseFinalTestAnalyticsForAdmin(this.dependencies, courseId);
  }

  async upsertChapterQuiz(
    courseId: string,
    chapterId: string,
    dto: UpsertChapterQuizDto,
  ): Promise<AdminQuizView> {
    validateQuizPayload(dto);
    await findChapterOrFail(this.dependencies, courseId, chapterId);
    await upsertQuizDefinition(this.dependencies, dto, {
      scope: QuizScope.CHAPTER_TRAINING,
      chapterId,
      courseId: null,
    });

    const quiz = await getChapterQuizForAdmin(this.dependencies, chapterId);

    if (!quiz) {
      throw new NotFoundException('Quiz not found after save');
    }

    return quiz;
  }

  async upsertCourseFinalTest(
    courseId: string,
    dto: UpsertChapterQuizDto,
  ): Promise<AdminFinalTestView> {
    validateQuizPayload(dto);
    await findCourseOrFail(this.dependencies, courseId);
    await upsertQuizDefinition(this.dependencies, dto, {
      scope: QuizScope.COURSE_FINAL,
      chapterId: null,
      courseId,
    });

    const finalTest = await getCourseFinalTestForAdmin(
      this.dependencies,
      courseId,
    );

    if (!finalTest) {
      throw new NotFoundException('Final test not found after save');
    }

    return finalTest;
  }

  async deleteChapterQuiz(
    courseId: string,
    chapterId: string,
    language: AppLanguage = 'en',
  ): Promise<void> {
    await findChapterOrFail(this.dependencies, courseId, chapterId);

    const quiz = await this.quizRepository.findOne({
      where: {
        scope: QuizScope.CHAPTER_TRAINING,
        chapterId,
      },
    });

    if (!quiz) {
      throw new NotFoundException(
        language === 'fi' ? 'Quizia ei loytynyt' : 'Quiz not found',
      );
    }

    await this.quizRepository.remove(quiz);
  }

  async deleteCourseFinalTest(
    courseId: string,
    language: AppLanguage = 'en',
  ): Promise<void> {
    await findCourseOrFail(this.dependencies, courseId);

    const quiz = await this.quizRepository.findOne({
      where: {
        scope: QuizScope.COURSE_FINAL,
        courseId,
      },
    });

    if (!quiz) {
      throw new NotFoundException(
        language === 'fi' ? 'Lopputestia ei loytynyt' : 'Final test not found',
      );
    }

    await this.quizRepository.remove(quiz);
  }

  async submitChapterQuizAttempt(
    courseId: string,
    chapterId: string,
    userId: number,
    dto: SubmitChapterQuizAttemptDto,
    language: AppLanguage = 'en',
  ): Promise<SubmitQuizAttemptResult> {
    await findChapterOrFail(this.dependencies, courseId, chapterId);
    return submitChapterQuizAttempt(
      this.dependencies,
      chapterId,
      userId,
      dto,
      language,
    );
  }

  async submitCourseFinalTestAttempt(
    courseId: string,
    currentUser: SafeUser,
    dto: SubmitChapterQuizAttemptDto,
    language: AppLanguage = 'en',
  ): Promise<SubmitQuizAttemptResult> {
    await findCourseOrFail(this.dependencies, courseId);
    return submitCourseFinalTestAttempt(
      this.dependencies,
      courseId,
      currentUser,
      dto,
      language,
    );
  }
}
