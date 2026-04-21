import { Quiz } from '../../entities/quiz.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import { QuizOption } from '../../entities/quiz-option.entity';
import { QuizQuestion } from '../../entities/quiz-question.entity';
import { QuizQuestionType } from '../../entities/quiz-question-type.enum';
import { QuizScope } from '../../entities/quiz-scope.enum';
import type { QuizzesServiceDependencies } from '../services/quizzes.service.dependencies';
import {
  getChapterQuizForAdmin,
  getChapterQuizForLearner,
  getCourseFinalTestForAdmin,
  getCourseFinalTestForLearner,
} from '../services/quizzes.readers';

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
    quizRepository,
    progressRepository,
    quizAttemptRepository,
    certificatesService,
  };
};

const createQuizTree = (): Quiz =>
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
        id: 'question-2',
        quizId: 'quiz-1',
        promptEn: 'Question 2',
        promptFi: 'Question 2',
        explanationEn: null,
        explanationFi: null,
        type: QuizQuestionType.MULTIPLE_CHOICE,
        orderIndex: 2,
        options: [
          Object.assign(new QuizOption(), {
            id: 'option-2b',
            questionId: 'question-2',
            labelEn: 'Correct B',
            labelFi: 'Correct B',
            isCorrect: true,
            orderIndex: 2,
          }),
          Object.assign(new QuizOption(), {
            id: 'option-2a',
            questionId: 'question-2',
            labelEn: 'Correct A',
            labelFi: 'Correct A',
            isCorrect: true,
            orderIndex: 1,
          }),
        ],
      }),
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
            id: 'option-1b',
            questionId: 'question-1',
            labelEn: 'Wrong',
            labelFi: 'Wrong',
            isCorrect: false,
            orderIndex: 2,
          }),
          Object.assign(new QuizOption(), {
            id: 'option-1a',
            questionId: 'question-1',
            labelEn: 'Correct',
            labelFi: 'Correct',
            isCorrect: true,
            orderIndex: 1,
          }),
        ],
      }),
    ],
    attempts: [],
  });

const createFinalTestTree = (): Quiz =>
  Object.assign(createQuizTree(), {
    id: 'final-test-1',
    scope: QuizScope.COURSE_FINAL,
    chapterId: null,
    courseId: 'course-1',
  });

const createAttempt = (score: number, passed: boolean): QuizAttempt =>
  Object.assign(new QuizAttempt(), {
    id: `attempt-${score}`,
    quizId: 'quiz-1',
    userId: 12,
    totalQuestions: 2,
    correctAnswers: score === 100 ? 2 : 1,
    score,
    passed,
    submittedAt: new Date(
      score === 100 ? '2026-01-02T00:00:00.000Z' : '2026-01-01T00:00:00.000Z',
    ),
  });

describe('quizzes.readers', () => {
  it('returns null when the admin chapter quiz does not exist', async () => {
    const { deps, quizRepository } = createDependencies();
    quizRepository.findOne.mockResolvedValue(null);

    await expect(getChapterQuizForAdmin(deps, 'chapter-1')).resolves.toBeNull();
  });

  it('returns a sorted admin chapter quiz view with aggregated stats', async () => {
    const { deps, quizRepository } = createDependencies();
    quizRepository.findOne.mockResolvedValue(
      Object.assign(createQuizTree(), {
        attempts: [createAttempt(50, false), createAttempt(100, true)],
      }),
    );

    const result = await getChapterQuizForAdmin(deps, 'chapter-1');

    expect(result?.stats).toEqual({
      attemptCount: 2,
      latestAttemptAt: new Date('2026-01-02T00:00:00.000Z'),
      bestScore: 100,
    });
    expect(result?.questions.map((question) => question.id)).toEqual([
      'question-1',
      'question-2',
    ]);
    expect(result?.questions[0]?.options.map((option) => option.id)).toEqual([
      'option-1a',
      'option-1b',
    ]);
  });

  it('returns a learner chapter quiz view without exposing correct answers', async () => {
    const { deps, quizRepository, quizAttemptRepository } =
      createDependencies();
    quizRepository.findOne.mockResolvedValue(createQuizTree());
    quizAttemptRepository.find.mockResolvedValue([
      createAttempt(100, true),
      createAttempt(50, false),
    ]);

    const result = await getChapterQuizForLearner(deps, 'chapter-1', 12);

    expect(result?.latestAttempt?.score).toBe(100);
    expect(result?.bestAttempt?.score).toBe(100);
    expect(result?.questions[0]?.options[0]).not.toHaveProperty('isCorrect');
  });

  it('returns null when the learner final test does not exist', async () => {
    const { deps, quizRepository } = createDependencies();
    quizRepository.findOne.mockResolvedValue(null);

    await expect(
      getCourseFinalTestForLearner(deps, 'course-1', 12),
    ).resolves.toBeNull();
  });

  it('syncs the certificate and exposes the learner final test view when a passed attempt exists', async () => {
    const {
      deps,
      quizRepository,
      quizAttemptRepository,
      progressRepository,
      certificatesService,
    } = createDependencies();
    const certificateState = {
      id: 'certificate-1',
      status: 'issued' as const,
      issuedAt: new Date('2026-01-03T00:00:00.000Z'),
    };

    quizRepository.findOne.mockResolvedValue(createFinalTestTree());
    quizAttemptRepository.find.mockResolvedValue([
      createAttempt(100, true),
      createAttempt(50, false),
    ]);
    progressRepository.findOne.mockResolvedValue({
      completed: false,
      completionPercentage: 100,
    });
    certificatesService.getCourseCertificateStatus.mockResolvedValue(
      certificateState,
    );

    const result = await getCourseFinalTestForLearner(deps, 'course-1', 12);

    expect(certificatesService.syncCourseCertificate.mock.calls).toContainEqual(
      [12, 'course-1'],
    );
    expect(result?.isUnlocked).toBe(true);
    expect(result?.certificate).toEqual(certificateState);
  });

  it('does not sync the certificate when no passed final test attempt exists', async () => {
    const {
      deps,
      quizRepository,
      quizAttemptRepository,
      progressRepository,
      certificatesService,
    } = createDependencies();

    quizRepository.findOne.mockResolvedValue(createFinalTestTree());
    quizAttemptRepository.find.mockResolvedValue([createAttempt(50, false)]);
    progressRepository.findOne.mockResolvedValue({
      completed: false,
      completionPercentage: 75,
    });
    certificatesService.getCourseCertificateStatus.mockResolvedValue(null);

    const result = await getCourseFinalTestForLearner(deps, 'course-1', 12);

    expect(certificatesService.syncCourseCertificate.mock.calls).toHaveLength(
      0,
    );
    expect(result?.isUnlocked).toBe(false);
    expect(result?.certificate).toBeNull();
  });

  it('returns null when the admin course final test does not exist', async () => {
    const { deps, quizRepository } = createDependencies();
    quizRepository.findOne.mockResolvedValue(null);

    await expect(
      getCourseFinalTestForAdmin(deps, 'course-1'),
    ).resolves.toBeNull();
  });
});
