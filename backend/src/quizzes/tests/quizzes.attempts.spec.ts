import { BadRequestException } from '@nestjs/common';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { Quiz } from '../../entities/quiz.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import { QuizOption } from '../../entities/quiz-option.entity';
import { QuizQuestion } from '../../entities/quiz-question.entity';
import { QuizQuestionType } from '../../entities/quiz-question-type.enum';
import { QuizScope } from '../../entities/quiz-scope.enum';
import { UserPlan, UserRole } from '../../entities/user.entity';
import type { QuizzesServiceDependencies } from '../services/quizzes.service.dependencies';
import {
  submitChapterQuizAttempt,
  submitCourseFinalTestAttempt,
} from '../services/quizzes.attempts';

type FindOneFn<T extends object> = (options?: unknown) => Promise<T | null>;
type FindFn<T extends object> = (options?: unknown) => Promise<T[]>;
type CreateFn<T extends object> = (entityLike?: Partial<T>) => T;
type SaveFn<T extends object> = (entity: T | T[]) => Promise<T | T[]>;
type DeleteFn = (criteria?: unknown) => Promise<unknown>;
type RemoveFn<T extends object> = (entity: T) => Promise<T>;

type MockRepository<T extends object> = {
  findOne: jest.MockedFunction<FindOneFn<T>>;
  find: jest.MockedFunction<FindFn<T>>;
  create: jest.MockedFunction<CreateFn<T>>;
  save: jest.MockedFunction<SaveFn<T>>;
  delete: jest.MockedFunction<DeleteFn>;
  remove: jest.MockedFunction<RemoveFn<T>>;
  manager: {
    transaction: jest.MockedFunction<
      (callback: (...args: unknown[]) => Promise<unknown>) => Promise<unknown>
    >;
  };
};

const createRepository = <T extends object>(): MockRepository<T> => ({
  findOne: jest.fn<FindOneFn<T>>(),
  find: jest.fn<FindFn<T>>(),
  create: jest.fn<CreateFn<T>>((entityLike?: Partial<T>) =>
    Object.assign({} as T, entityLike),
  ),
  save: jest.fn<SaveFn<T>>((entity: T | T[]) => Promise.resolve(entity)),
  delete: jest.fn<DeleteFn>(() => Promise.resolve({})),
  remove: jest.fn<RemoveFn<T>>((entity: T) => Promise.resolve(entity)),
  manager: {
    transaction: jest.fn((callback: (...args: unknown[]) => Promise<unknown>) =>
      callback(),
    ),
  },
});

const createDependencies = () => {
  const chapterRepository = createRepository<object>();
  const courseRepository = createRepository<object>();
  const progressRepository = createRepository<object>();
  const quizRepository = createRepository<Quiz>();
  const quizQuestionRepository = createRepository<QuizQuestion>();
  const quizOptionRepository = createRepository<QuizOption>();
  const quizAttemptRepository = createRepository<QuizAttempt>();
  const quizAttemptAnswerRepository = createRepository<object>();
  const certificatesService = {
    syncCourseCertificate: jest.fn(),
    getCourseCertificateStatus: jest.fn(),
  };

  const deps = {
    chapterRepository,
    courseRepository,
    progressRepository,
    quizRepository,
    quizQuestionRepository,
    quizOptionRepository,
    quizAttemptRepository,
    quizAttemptAnswerRepository,
    certificatesService,
  } as unknown as QuizzesServiceDependencies;

  return {
    deps,
    progressRepository,
    quizRepository,
    quizAttemptRepository,
    quizAttemptAnswerRepository,
    certificatesService,
  };
};

const createCurrentUser = (overrides: Partial<SafeUser> = {}): SafeUser => ({
  id: 12,
  email: 'user@example.com',
  firstName: 'User',
  lastName: 'Example',
  occupation: null,
  role: UserRole.USER,
  plan: UserPlan.FREE,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  ...overrides,
});

const createQuizTree = (overrides: Partial<Quiz> = {}): Quiz =>
  Object.assign(new Quiz(), {
    id: 'quiz-1',
    scope: QuizScope.CHAPTER_TRAINING,
    chapterId: 'chapter-1',
    courseId: null,
    titleEn: 'Foundations quiz',
    titleFi: 'Foundations quiz',
    descriptionEn: 'Quiz',
    descriptionFi: 'Quiz',
    passingScore: 70,
    isPublished: true,
    questions: [
      Object.assign(new QuizQuestion(), {
        id: 'question-1',
        quizId: 'quiz-1',
        promptEn: 'Question 1',
        promptFi: 'Question 1',
        explanationEn: null,
        explanationFi: null,
        type: QuizQuestionType.SINGLE_CHOICE,
        orderIndex: 1,
        options: [
          Object.assign(new QuizOption(), {
            id: 'option-1a',
            questionId: 'question-1',
            labelEn: 'Correct',
            labelFi: 'Correct',
            isCorrect: true,
            orderIndex: 1,
          }),
          Object.assign(new QuizOption(), {
            id: 'option-1b',
            questionId: 'question-1',
            labelEn: 'Wrong',
            labelFi: 'Wrong',
            isCorrect: false,
            orderIndex: 2,
          }),
        ],
      }),
    ],
    attempts: [],
    ...overrides,
  });

const createAttempt = (score: number, passed: boolean): QuizAttempt =>
  Object.assign(new QuizAttempt(), {
    id: `attempt-${score}`,
    quizId: 'quiz-1',
    userId: 12,
    totalQuestions: 1,
    correctAnswers: score === 100 ? 1 : 0,
    score,
    passed,
    submittedAt: new Date('2026-01-02T00:00:00.000Z'),
  });

describe('quizzes.attempts', () => {
  it('throws a translated error when the published chapter quiz is missing', async () => {
    const { deps, quizRepository } = createDependencies();
    quizRepository.findOne.mockResolvedValue(null);

    await expect(
      submitChapterQuizAttempt(deps, 'chapter-1', 12, { answers: [] }, 'fi'),
    ).rejects.toThrow('Julkaistua harjoitusquizia ei loytynyt');
  });

  it('throws when chapter quiz persistence does not produce a latest attempt', async () => {
    const { deps, quizRepository, quizAttemptRepository } =
      createDependencies();
    quizRepository.findOne.mockResolvedValue(createQuizTree());
    quizAttemptRepository.save.mockResolvedValue(createAttempt(100, true));
    quizAttemptRepository.find.mockResolvedValue([]);

    await expect(
      submitChapterQuizAttempt(
        deps,
        'chapter-1',
        12,
        {
          answers: [
            { questionId: 'question-1', selectedOptionIds: ['option-1a'] },
          ],
        },
        'en',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws a translated error when the published final test is missing', async () => {
    const { deps, quizRepository } = createDependencies();
    quizRepository.findOne.mockResolvedValue(null);

    await expect(
      submitCourseFinalTestAttempt(
        deps,
        'course-1',
        createCurrentUser(),
        { answers: [] },
        'fi',
      ),
    ).rejects.toThrow('Julkaistua lopputestia ei loytynyt');
  });

  it('lets an admin submit the final test without checking course progress', async () => {
    const {
      deps,
      progressRepository,
      quizRepository,
      quizAttemptRepository,
      certificatesService,
    } = createDependencies();
    quizRepository.findOne.mockResolvedValue(
      createQuizTree({
        id: 'final-test-1',
        scope: QuizScope.COURSE_FINAL,
        chapterId: null,
        courseId: 'course-1',
      }),
    );
    quizAttemptRepository.save.mockResolvedValue(createAttempt(100, true));
    quizAttemptRepository.find.mockResolvedValue([createAttempt(100, true)]);

    const result = await submitCourseFinalTestAttempt(
      deps,
      'course-1',
      createCurrentUser({ role: UserRole.ADMIN }),
      {
        answers: [
          { questionId: 'question-1', selectedOptionIds: ['option-1a'] },
        ],
      },
      'en',
    );

    expect(progressRepository.findOne).not.toHaveBeenCalled();
    expect(certificatesService.syncCourseCertificate.mock.calls).toContainEqual(
      [12, 'course-1'],
    );
    expect(result.attempt.score).toBe(100);
  });

  it('throws when final test persistence does not produce a latest attempt', async () => {
    const { deps, quizRepository, progressRepository, quizAttemptRepository } =
      createDependencies();
    quizRepository.findOne.mockResolvedValue(
      createQuizTree({
        id: 'final-test-1',
        scope: QuizScope.COURSE_FINAL,
        chapterId: null,
        courseId: 'course-1',
      }),
    );
    progressRepository.findOne.mockResolvedValue({
      completed: true,
      completionPercentage: 100,
    });
    quizAttemptRepository.save.mockResolvedValue(createAttempt(100, true));
    quizAttemptRepository.find.mockResolvedValue([]);

    await expect(
      submitCourseFinalTestAttempt(
        deps,
        'course-1',
        createCurrentUser(),
        {
          answers: [
            { questionId: 'question-1', selectedOptionIds: ['option-1a'] },
          ],
        },
        'en',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('blocks learners until the course is completed', async () => {
    const { deps, quizRepository, progressRepository } = createDependencies();
    quizRepository.findOne.mockResolvedValue(
      createQuizTree({
        id: 'final-test-1',
        scope: QuizScope.COURSE_FINAL,
        chapterId: null,
        courseId: 'course-1',
      }),
    );
    progressRepository.findOne.mockResolvedValue({
      completed: false,
      completionPercentage: 75,
    });

    await expect(
      submitCourseFinalTestAttempt(
        deps,
        'course-1',
        createCurrentUser(),
        {
          answers: [
            { questionId: 'question-1', selectedOptionIds: ['option-1a'] },
          ],
        },
        'en',
      ),
    ).rejects.toThrow(
      'The final test unlocks only after the course is completed',
    );
  });
});
