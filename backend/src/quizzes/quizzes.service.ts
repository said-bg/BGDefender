import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { SafeUser } from '../auth/types/safe-user.type';
import type { AppLanguage } from '../config/request-language';
import { Chapter } from '../entities/chapter.entity';
import { Course } from '../entities/course.entity';
import { Progress } from '../entities/progress.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { QuizAttemptAnswer } from '../entities/quiz-attempt-answer.entity';
import { QuizOption } from '../entities/quiz-option.entity';
import { QuizQuestion } from '../entities/quiz-question.entity';
import { QuizScope } from '../entities/quiz-scope.enum';
import { UserRole } from '../entities/user.entity';
import { CertificatesService } from '../certificates/certificates.service';
import { SubmitChapterQuizAttemptDto } from './dto/submit-chapter-quiz-attempt.dto';
import { UpsertChapterQuizDto } from './dto/upsert-chapter-quiz.dto';
import { evaluateQuizAttempt, validateQuizPayload } from './quizzes.utils';

type QuizAttemptView = {
  id: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  submittedAt: Date;
};

type AdminQuizView = {
  id: string;
  chapterId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: Array<{
    id: string;
    promptEn: string;
    promptFi: string;
    explanationEn: string | null;
    explanationFi: string | null;
    type: string;
    orderIndex: number;
    options: Array<{
      id: string;
      labelEn: string;
      labelFi: string;
      orderIndex: number;
      isCorrect: boolean;
    }>;
  }>;
  stats: {
    attemptCount: number;
    latestAttemptAt: Date | null;
    bestScore: number | null;
  };
};

type LearnerQuizView = {
  id: string;
  chapterId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: Array<{
    id: string;
    promptEn: string;
    promptFi: string;
    explanationEn: string | null;
    explanationFi: string | null;
    type: string;
    orderIndex: number;
    options: Array<{
      id: string;
      labelEn: string;
      labelFi: string;
      orderIndex: number;
    }>;
  }>;
  latestAttempt: QuizAttemptView | null;
  bestAttempt: QuizAttemptView | null;
};

type AdminFinalTestView = {
  id: string;
  courseId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  questions: AdminQuizView['questions'];
  stats: AdminQuizView['stats'];
};

type LearnerFinalTestView = {
  id: string;
  courseId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  passingScore: number;
  isPublished: boolean;
  isUnlocked: boolean;
  certificate: {
    id: string;
    status: 'pending_profile' | 'issued';
    issuedAt: Date | null;
  } | null;
  questions: LearnerQuizView['questions'];
  latestAttempt: QuizAttemptView | null;
  bestAttempt: QuizAttemptView | null;
};

type SubmitQuizAttemptResult = {
  attempt: QuizAttemptView;
  latestAttempt: QuizAttemptView;
  bestAttempt: QuizAttemptView;
};

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

  async getChapterQuiz(
    courseId: string,
    chapterId: string,
    currentUser: SafeUser,
  ): Promise<AdminQuizView | LearnerQuizView | null> {
    await this.findChapterOrFail(courseId, chapterId);

    if (currentUser.role === UserRole.ADMIN) {
      return this.getChapterQuizForAdmin(chapterId);
    }

    return this.getChapterQuizForLearner(chapterId, currentUser.id);
  }

  async getCourseFinalTest(
    courseId: string,
    currentUser: SafeUser,
  ): Promise<AdminFinalTestView | LearnerFinalTestView | null> {
    await this.findCourseOrFail(courseId);

    if (currentUser.role === UserRole.ADMIN) {
      return this.getCourseFinalTestForAdmin(courseId);
    }

    return this.getCourseFinalTestForLearner(courseId, currentUser.id);
  }

  async upsertChapterQuiz(
    courseId: string,
    chapterId: string,
    dto: UpsertChapterQuizDto,
  ): Promise<AdminQuizView> {
    validateQuizPayload(dto);
    await this.findChapterOrFail(courseId, chapterId);

    await this.upsertQuizDefinition(dto, {
      scope: QuizScope.CHAPTER_TRAINING,
      chapterId,
      courseId: null,
    });

    const quiz = await this.getChapterQuizForAdmin(chapterId);

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
    await this.findCourseOrFail(courseId);

    await this.upsertQuizDefinition(dto, {
      scope: QuizScope.COURSE_FINAL,
      chapterId: null,
      courseId,
    });

    const finalTest = await this.getCourseFinalTestForAdmin(courseId);

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
    await this.findChapterOrFail(courseId, chapterId);

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
    await this.findCourseOrFail(courseId);

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
    await this.findChapterOrFail(courseId, chapterId);

    const quiz = await this.quizRepository.findOne({
      where: {
        scope: QuizScope.CHAPTER_TRAINING,
        chapterId,
        isPublished: true,
      },
      relations: {
        questions: {
          options: true,
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(
        language === 'fi'
          ? 'Julkaistua harjoitusquizia ei loytynyt'
          : 'Published training quiz not found',
      );
    }

    const orderedQuiz = this.sortQuizTree(quiz);
    const evaluation = evaluateQuizAttempt(orderedQuiz.questions, dto.answers);
    const passed = evaluation.score >= orderedQuiz.passingScore;

    const attempt = await this.quizAttemptRepository.save(
      this.quizAttemptRepository.create({
        quizId: orderedQuiz.id,
        userId,
        totalQuestions: evaluation.totalQuestions,
        correctAnswers: evaluation.correctAnswers,
        score: evaluation.score,
        passed,
      }),
    );

    const attemptAnswers = evaluation.answers.map((answer) =>
      this.quizAttemptAnswerRepository.create({
        attemptId: attempt.id,
        questionId: answer.questionId,
        questionType: answer.questionType,
        promptEn: answer.promptEn,
        promptFi: answer.promptFi,
        selectedOptionIds: answer.selectedOptionIds,
        correctOptionIds: answer.correctOptionIds,
        isCorrect: answer.isCorrect,
      }),
    );

    await this.quizAttemptAnswerRepository.save(attemptAnswers);

    const attempts = await this.quizAttemptRepository.find({
      where: { quizId: orderedQuiz.id, userId },
      order: { submittedAt: 'DESC' },
    });

    const latestAttempt = attempts[0];
    const bestAttempt =
      attempts.reduce<QuizAttempt | null>((best, current) => {
        if (!best) {
          return current;
        }

        return current.score > best.score ? current : best;
      }, null) ?? null;

    if (!latestAttempt || !bestAttempt) {
      throw new BadRequestException('Quiz attempt persistence failed');
    }

    return {
      attempt: this.toAttemptView(attempt),
      latestAttempt: this.toAttemptView(latestAttempt),
      bestAttempt: this.toAttemptView(bestAttempt),
    };
  }

  async submitCourseFinalTestAttempt(
    courseId: string,
    currentUser: SafeUser,
    dto: SubmitChapterQuizAttemptDto,
    language: AppLanguage = 'en',
  ): Promise<SubmitQuizAttemptResult> {
    await this.findCourseOrFail(courseId);

    const quiz = await this.quizRepository.findOne({
      where: {
        scope: QuizScope.COURSE_FINAL,
        courseId,
        isPublished: true,
      },
      relations: {
        questions: {
          options: true,
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(
        language === 'fi'
          ? 'Julkaistua lopputestia ei loytynyt'
          : 'Published final test not found',
      );
    }

    if (currentUser.role !== UserRole.ADMIN) {
      const progress = await this.progressRepository.findOne({
        where: {
          userId: currentUser.id,
          courseId,
        },
      });

      if (!progress?.completed && (progress?.completionPercentage ?? 0) < 100) {
        throw new BadRequestException(
          language === 'fi'
            ? 'Lopputesti avautuu vasta kun kurssi on suoritettu'
            : 'The final test unlocks only after the course is completed',
        );
      }
    }

    const orderedQuiz = this.sortQuizTree(quiz);
    const evaluation = evaluateQuizAttempt(orderedQuiz.questions, dto.answers);
    const passed = evaluation.score >= orderedQuiz.passingScore;

    const attempt = await this.quizAttemptRepository.save(
      this.quizAttemptRepository.create({
        quizId: orderedQuiz.id,
        userId: currentUser.id,
        totalQuestions: evaluation.totalQuestions,
        correctAnswers: evaluation.correctAnswers,
        score: evaluation.score,
        passed,
      }),
    );

    const attemptAnswers = evaluation.answers.map((answer) =>
      this.quizAttemptAnswerRepository.create({
        attemptId: attempt.id,
        questionId: answer.questionId,
        questionType: answer.questionType,
        promptEn: answer.promptEn,
        promptFi: answer.promptFi,
        selectedOptionIds: answer.selectedOptionIds,
        correctOptionIds: answer.correctOptionIds,
        isCorrect: answer.isCorrect,
      }),
    );

    await this.quizAttemptAnswerRepository.save(attemptAnswers);

    const attempts = await this.quizAttemptRepository.find({
      where: { quizId: orderedQuiz.id, userId: currentUser.id },
      order: { submittedAt: 'DESC' },
    });

    const latestAttempt = attempts[0];
    const bestAttempt =
      attempts.reduce<QuizAttempt | null>((best, current) => {
        if (!best) {
          return current;
        }

        return current.score > best.score ? current : best;
      }, null) ?? null;

    if (!latestAttempt || !bestAttempt) {
      throw new BadRequestException('Final test attempt persistence failed');
    }

    await this.certificatesService.syncCourseCertificate(
      currentUser.id,
      courseId,
    );

    return {
      attempt: this.toAttemptView(attempt),
      latestAttempt: this.toAttemptView(latestAttempt),
      bestAttempt: this.toAttemptView(bestAttempt),
    };
  }

  private async getChapterQuizForAdmin(
    chapterId: string,
  ): Promise<AdminQuizView | null> {
    const quiz = await this.quizRepository.findOne({
      where: {
        scope: QuizScope.CHAPTER_TRAINING,
        chapterId,
      },
      relations: {
        questions: {
          options: true,
        },
        attempts: true,
      },
    });

    if (!quiz) {
      return null;
    }

    const orderedQuiz = this.sortQuizTree(quiz);
    const attempts = orderedQuiz.attempts ?? [];

    return {
      id: orderedQuiz.id,
      chapterId: orderedQuiz.chapterId ?? chapterId,
      titleEn: orderedQuiz.titleEn,
      titleFi: orderedQuiz.titleFi,
      descriptionEn: orderedQuiz.descriptionEn,
      descriptionFi: orderedQuiz.descriptionFi,
      passingScore: orderedQuiz.passingScore,
      isPublished: orderedQuiz.isPublished,
      questions: orderedQuiz.questions.map((question) => ({
        id: question.id,
        promptEn: question.promptEn,
        promptFi: question.promptFi,
        explanationEn: question.explanationEn,
        explanationFi: question.explanationFi,
        type: question.type,
        orderIndex: question.orderIndex,
        options: question.options.map((option) => ({
          id: option.id,
          labelEn: option.labelEn,
          labelFi: option.labelFi,
          orderIndex: option.orderIndex,
          isCorrect: option.isCorrect,
        })),
      })),
      stats: {
        attemptCount: attempts.length,
        latestAttemptAt:
          attempts.length > 0
            ? attempts
                .map((attempt) => attempt.submittedAt)
                .sort((left, right) => right.getTime() - left.getTime())[0]
            : null,
        bestScore:
          attempts.length > 0
            ? Math.max(...attempts.map((attempt) => attempt.score))
            : null,
      },
    };
  }

  private async getCourseFinalTestForAdmin(
    courseId: string,
  ): Promise<AdminFinalTestView | null> {
    const quiz = await this.quizRepository.findOne({
      where: {
        scope: QuizScope.COURSE_FINAL,
        courseId,
      },
      relations: {
        questions: {
          options: true,
        },
        attempts: true,
      },
    });

    if (!quiz) {
      return null;
    }

    const orderedQuiz = this.sortQuizTree(quiz);
    const attempts = orderedQuiz.attempts ?? [];

    return {
      id: orderedQuiz.id,
      courseId,
      titleEn: orderedQuiz.titleEn,
      titleFi: orderedQuiz.titleFi,
      descriptionEn: orderedQuiz.descriptionEn,
      descriptionFi: orderedQuiz.descriptionFi,
      passingScore: orderedQuiz.passingScore,
      isPublished: orderedQuiz.isPublished,
      questions: orderedQuiz.questions.map((question) => ({
        id: question.id,
        promptEn: question.promptEn,
        promptFi: question.promptFi,
        explanationEn: question.explanationEn,
        explanationFi: question.explanationFi,
        type: question.type,
        orderIndex: question.orderIndex,
        options: question.options.map((option) => ({
          id: option.id,
          labelEn: option.labelEn,
          labelFi: option.labelFi,
          orderIndex: option.orderIndex,
          isCorrect: option.isCorrect,
        })),
      })),
      stats: {
        attemptCount: attempts.length,
        latestAttemptAt:
          attempts.length > 0
            ? attempts
                .map((attempt) => attempt.submittedAt)
                .sort((left, right) => right.getTime() - left.getTime())[0]
            : null,
        bestScore:
          attempts.length > 0
            ? Math.max(...attempts.map((attempt) => attempt.score))
            : null,
      },
    };
  }

  private async getChapterQuizForLearner(
    chapterId: string,
    userId: number,
  ): Promise<LearnerQuizView | null> {
    const quiz = await this.quizRepository.findOne({
      where: {
        scope: QuizScope.CHAPTER_TRAINING,
        chapterId,
        isPublished: true,
      },
      relations: {
        questions: {
          options: true,
        },
      },
    });

    if (!quiz) {
      return null;
    }

    const attempts = await this.quizAttemptRepository.find({
      where: { quizId: quiz.id, userId },
      order: { submittedAt: 'DESC' },
    });

    const latestAttempt = attempts[0] ?? null;
    const bestAttempt =
      attempts.reduce<QuizAttempt | null>((best, current) => {
        if (!best) {
          return current;
        }

        return current.score > best.score ? current : best;
      }, null) ?? null;

    const orderedQuiz = this.sortQuizTree(quiz);

    return {
      id: orderedQuiz.id,
      chapterId: orderedQuiz.chapterId ?? chapterId,
      titleEn: orderedQuiz.titleEn,
      titleFi: orderedQuiz.titleFi,
      descriptionEn: orderedQuiz.descriptionEn,
      descriptionFi: orderedQuiz.descriptionFi,
      passingScore: orderedQuiz.passingScore,
      isPublished: orderedQuiz.isPublished,
      questions: orderedQuiz.questions.map((question) => ({
        id: question.id,
        promptEn: question.promptEn,
        promptFi: question.promptFi,
        explanationEn: question.explanationEn,
        explanationFi: question.explanationFi,
        type: question.type,
        orderIndex: question.orderIndex,
        options: question.options.map((option) => ({
          id: option.id,
          labelEn: option.labelEn,
          labelFi: option.labelFi,
          orderIndex: option.orderIndex,
        })),
      })),
      latestAttempt: latestAttempt ? this.toAttemptView(latestAttempt) : null,
      bestAttempt: bestAttempt ? this.toAttemptView(bestAttempt) : null,
    };
  }

  private async getCourseFinalTestForLearner(
    courseId: string,
    userId: number,
  ): Promise<LearnerFinalTestView | null> {
    const quiz = await this.quizRepository.findOne({
      where: {
        scope: QuizScope.COURSE_FINAL,
        courseId,
        isPublished: true,
      },
      relations: {
        questions: {
          options: true,
        },
      },
    });

    if (!quiz) {
      return null;
    }

    const [attempts, progress] = await Promise.all([
      this.quizAttemptRepository.find({
        where: { quizId: quiz.id, userId },
        order: { submittedAt: 'DESC' },
      }),
      this.progressRepository.findOne({
        where: {
          userId,
          courseId,
        },
      }),
    ]);

    const latestAttempt = attempts[0] ?? null;
    const bestAttempt =
      attempts.reduce<QuizAttempt | null>((best, current) => {
        if (!best) {
          return current;
        }

        return current.score > best.score ? current : best;
      }, null) ?? null;

    const orderedQuiz = this.sortQuizTree(quiz);
    const passedAttemptExists = attempts.some((attempt) => attempt.passed);

    if (passedAttemptExists) {
      await this.certificatesService.syncCourseCertificate(userId, courseId);
    }

    const certificate =
      await this.certificatesService.getCourseCertificateStatus(
        userId,
        courseId,
      );

    return {
      id: orderedQuiz.id,
      courseId,
      titleEn: orderedQuiz.titleEn,
      titleFi: orderedQuiz.titleFi,
      descriptionEn: orderedQuiz.descriptionEn,
      descriptionFi: orderedQuiz.descriptionFi,
      passingScore: orderedQuiz.passingScore,
      isPublished: orderedQuiz.isPublished,
      isUnlocked: Boolean(
        progress?.completed || (progress?.completionPercentage ?? 0) >= 100,
      ),
      certificate,
      questions: orderedQuiz.questions.map((question) => ({
        id: question.id,
        promptEn: question.promptEn,
        promptFi: question.promptFi,
        explanationEn: question.explanationEn,
        explanationFi: question.explanationFi,
        type: question.type,
        orderIndex: question.orderIndex,
        options: question.options.map((option) => ({
          id: option.id,
          labelEn: option.labelEn,
          labelFi: option.labelFi,
          orderIndex: option.orderIndex,
        })),
      })),
      latestAttempt: latestAttempt ? this.toAttemptView(latestAttempt) : null,
      bestAttempt: bestAttempt ? this.toAttemptView(bestAttempt) : null,
    };
  }

  private async upsertQuizDefinition(
    dto: UpsertChapterQuizDto,
    target: {
      scope: QuizScope;
      chapterId: string | null;
      courseId: string | null;
    },
  ): Promise<void> {
    await this.quizRepository.manager.transaction(async (manager) => {
      const quizRepository = manager.getRepository(Quiz);
      const questionRepository = manager.getRepository(QuizQuestion);
      const optionRepository = manager.getRepository(QuizOption);

      const existingQuiz = await quizRepository.findOne({
        where:
          target.scope === QuizScope.CHAPTER_TRAINING
            ? {
                scope: target.scope,
                chapterId: target.chapterId ?? undefined,
              }
            : {
                scope: target.scope,
                courseId: target.courseId ?? undefined,
              },
      });

      const quiz =
        existingQuiz ??
        quizRepository.create({
          scope: target.scope,
          chapterId: target.chapterId,
          courseId: target.courseId,
        });

      Object.assign(quiz, {
        titleEn: dto.titleEn,
        titleFi: dto.titleFi,
        descriptionEn: dto.descriptionEn ?? null,
        descriptionFi: dto.descriptionFi ?? null,
        passingScore: dto.passingScore,
        isPublished: dto.isPublished,
      });

      const savedQuiz = await quizRepository.save(quiz);

      const existingQuestions = await questionRepository.find({
        where: { quizId: savedQuiz.id },
      });

      if (existingQuestions.length > 0) {
        await optionRepository.delete({
          questionId: In(existingQuestions.map((question) => question.id)),
        });
        await questionRepository.delete({ quizId: savedQuiz.id });
      }

      for (const questionDto of dto.questions) {
        const question = questionRepository.create({
          quizId: savedQuiz.id,
          promptEn: questionDto.promptEn,
          promptFi: questionDto.promptFi,
          explanationEn: questionDto.explanationEn ?? null,
          explanationFi: questionDto.explanationFi ?? null,
          type: questionDto.type,
          orderIndex: questionDto.orderIndex,
        });

        const savedQuestion = await questionRepository.save(question);

        const options = questionDto.options.map((optionDto) =>
          optionRepository.create({
            questionId: savedQuestion.id,
            labelEn: optionDto.labelEn,
            labelFi: optionDto.labelFi,
            isCorrect: optionDto.isCorrect,
            orderIndex: optionDto.orderIndex,
          }),
        );

        await optionRepository.save(options);
      }
    });
  }

  private sortQuizTree(quiz: Quiz): Quiz {
    return {
      ...quiz,
      questions: [...(quiz.questions ?? [])]
        .sort((left, right) => left.orderIndex - right.orderIndex)
        .map((question) => ({
          ...question,
          options: [...(question.options ?? [])].sort(
            (left, right) => left.orderIndex - right.orderIndex,
          ),
        })),
    };
  }

  private toAttemptView(attempt: QuizAttempt): QuizAttemptView {
    return {
      id: attempt.id,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      score: attempt.score,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
    };
  }

  private async findChapterOrFail(
    courseId: string,
    chapterId: string,
  ): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId, courseId },
    });

    if (!chapter) {
      throw new NotFoundException(
        `Chapter with ID ${chapterId} not found in course ${courseId}`,
      );
    }

    return chapter;
  }

  private async findCourseOrFail(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return course;
  }
}
