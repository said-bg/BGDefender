import { NotFoundException } from '@nestjs/common';
import { Quiz } from '../../entities/quiz.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import { QuizOption } from '../../entities/quiz-option.entity';
import { QuizQuestion } from '../../entities/quiz-question.entity';
import { QuizQuestionType } from '../../entities/quiz-question-type.enum';
import { QuizScope } from '../../entities/quiz-scope.enum';
import type { QuizzesServiceDependencies } from '../services/quizzes.service.dependencies';
import {
  findChapterOrFail,
  findCourseOrFail,
  getBestAttempt,
  getLatestAttempt,
  sortQuizTree,
} from '../services/quizzes.shared';

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

  const deps = {
    chapterRepository,
    courseRepository,
    progressRepository: createRepository<object>(),
    quizRepository: createRepository<Quiz>(),
    quizQuestionRepository: createRepository<QuizQuestion>(),
    quizOptionRepository: createRepository<QuizOption>(),
    quizAttemptRepository: createRepository<QuizAttempt>(),
    quizAttemptAnswerRepository: createRepository<object>(),
    certificatesService: {
      syncCourseCertificate: jest.fn(),
      getCourseCertificateStatus: jest.fn(),
    },
  } as unknown as QuizzesServiceDependencies;

  return { deps, chapterRepository, courseRepository };
};

const createAttempt = (score: number): QuizAttempt =>
  Object.assign(new QuizAttempt(), {
    id: `attempt-${score}`,
    quizId: 'quiz-1',
    userId: 12,
    totalQuestions: 2,
    correctAnswers: score === 100 ? 2 : 1,
    score,
    passed: score === 100,
    submittedAt: new Date('2026-01-02T00:00:00.000Z'),
  });

describe('quizzes.shared', () => {
  it('sorts questions and options by order index', () => {
    const quiz = Object.assign(new Quiz(), {
      id: 'quiz-1',
      scope: QuizScope.CHAPTER_TRAINING,
      questions: [
        Object.assign(new QuizQuestion(), {
          id: 'question-2',
          type: QuizQuestionType.SINGLE_CHOICE,
          orderIndex: 2,
          options: [
            Object.assign(new QuizOption(), { id: 'option-2b', orderIndex: 2 }),
            Object.assign(new QuizOption(), { id: 'option-2a', orderIndex: 1 }),
          ],
        }),
        Object.assign(new QuizQuestion(), {
          id: 'question-1',
          type: QuizQuestionType.SINGLE_CHOICE,
          orderIndex: 1,
          options: [
            Object.assign(new QuizOption(), { id: 'option-1b', orderIndex: 2 }),
            Object.assign(new QuizOption(), { id: 'option-1a', orderIndex: 1 }),
          ],
        }),
      ],
    });

    const result = sortQuizTree(quiz);

    expect(result.questions.map((question) => question.id)).toEqual([
      'question-1',
      'question-2',
    ]);
    expect(result.questions[0]?.options.map((option) => option.id)).toEqual([
      'option-1a',
      'option-1b',
    ]);
  });

  it('returns the first latest attempt and the highest best attempt', () => {
    const attempts = [createAttempt(50), createAttempt(100)];

    expect(getLatestAttempt(attempts)?.id).toBe('attempt-50');
    expect(getBestAttempt(attempts)?.id).toBe('attempt-100');
  });

  it('returns null for latest and best attempt when there are no attempts', () => {
    expect(getLatestAttempt([])).toBeNull();
    expect(getBestAttempt([])).toBeNull();
  });

  it('throws when a chapter cannot be found in the given course', async () => {
    const { deps, chapterRepository } = createDependencies();
    chapterRepository.findOne.mockResolvedValue(null);

    await expect(
      findChapterOrFail(deps, 'course-1', 'chapter-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws when a course cannot be found', async () => {
    const { deps, courseRepository } = createDependencies();
    courseRepository.findOne.mockResolvedValue(null);

    await expect(findCourseOrFail(deps, 'course-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
