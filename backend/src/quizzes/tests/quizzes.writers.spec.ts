import { Quiz } from '../../entities/quiz.entity';
import { QuizOption } from '../../entities/quiz-option.entity';
import { QuizQuestion } from '../../entities/quiz-question.entity';
import { QuizQuestionType } from '../../entities/quiz-question-type.enum';
import { QuizScope } from '../../entities/quiz-scope.enum';
import type { QuizzesServiceDependencies } from '../services/quizzes.service.dependencies';
import { upsertQuizDefinition } from '../services/quizzes.writers';

type FindOneFn<T extends object> = (options?: unknown) => Promise<T | null>;
type FindFn<T extends object> = (options?: unknown) => Promise<T[]>;
type CreateFn<T extends object> = (entityLike?: Partial<T>) => T;
type SaveFn<T extends object> = (entity: T | T[]) => Promise<T | T[]>;
type DeleteFn = (criteria?: unknown) => Promise<unknown>;
type RemoveFn<T extends object> = (entity: T) => Promise<T>;
type TransactionCallback = (entityManager: {
  getRepository: <Entity>(entity: new () => Entity) => Entity;
}) => Promise<unknown>;

type MockRepository<T extends object> = {
  findOne: jest.MockedFunction<FindOneFn<T>>;
  find: jest.MockedFunction<FindFn<T>>;
  create: jest.MockedFunction<CreateFn<T>>;
  save: jest.MockedFunction<SaveFn<T>>;
  delete: jest.MockedFunction<DeleteFn>;
  remove: jest.MockedFunction<RemoveFn<T>>;
  manager: {
    transaction: jest.MockedFunction<
      (callback: TransactionCallback) => Promise<unknown>
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
    transaction: jest.fn((callback: TransactionCallback) =>
      callback({
        getRepository: <Entity>(entity: new () => Entity): Entity => {
          void entity;
          return {} as unknown as Entity;
        },
      }),
    ),
  },
});

const createDependencies = () => {
  const depsQuizRepository = createRepository<Quiz>();
  const deps = {
    chapterRepository: createRepository<object>(),
    courseRepository: createRepository<object>(),
    progressRepository: createRepository<object>(),
    quizRepository: depsQuizRepository,
    quizQuestionRepository: createRepository<QuizQuestion>(),
    quizOptionRepository: createRepository<QuizOption>(),
    quizAttemptRepository: createRepository<object>(),
    quizAttemptAnswerRepository: createRepository<object>(),
    certificatesService: {
      syncCourseCertificate: jest.fn(),
      getCourseCertificateStatus: jest.fn(),
    },
  } as unknown as QuizzesServiceDependencies;

  return { deps, depsQuizRepository };
};

const createDto = () => ({
  titleEn: 'Quiz',
  titleFi: 'Quiz',
  descriptionEn: null,
  descriptionFi: null,
  passingScore: 70,
  isPublished: true,
  questions: [
    {
      promptEn: 'Question 1',
      promptFi: 'Question 1',
      explanationEn: null,
      explanationFi: null,
      type: QuizQuestionType.SINGLE_CHOICE,
      orderIndex: 1,
      options: [
        {
          labelEn: 'Correct',
          labelFi: 'Correct',
          isCorrect: true,
          orderIndex: 1,
        },
        {
          labelEn: 'Wrong',
          labelFi: 'Wrong',
          isCorrect: false,
          orderIndex: 2,
        },
      ],
    },
  ],
});

describe('quizzes.writers', () => {
  it('creates a new chapter quiz definition inside a transaction', async () => {
    const { deps, depsQuizRepository } = createDependencies();
    const quizRepository = createRepository<Quiz>();
    const questionRepository = createRepository<QuizQuestion>();
    const optionRepository = createRepository<QuizOption>();

    depsQuizRepository.manager.transaction.mockImplementation(
      (callback: TransactionCallback) =>
        callback({
          getRepository: <Entity>(entity: new () => Entity): Entity => {
            if (entity === Quiz) {
              return quizRepository as unknown as Entity;
            }
            if (entity === QuizQuestion) {
              return questionRepository as unknown as Entity;
            }
            return optionRepository as unknown as Entity;
          },
        }),
    );
    quizRepository.findOne.mockResolvedValue(null);
    quizRepository.save.mockResolvedValue({ id: 'quiz-1' } as Quiz);
    questionRepository.find.mockResolvedValue([]);
    questionRepository.save.mockResolvedValue({
      id: 'question-1',
    } as QuizQuestion);

    await upsertQuizDefinition(deps, createDto(), {
      scope: QuizScope.CHAPTER_TRAINING,
      chapterId: 'chapter-1',
      courseId: null,
    });

    expect(quizRepository.findOne).toHaveBeenCalledWith({
      where: { scope: QuizScope.CHAPTER_TRAINING, chapterId: 'chapter-1' },
    });
    expect(questionRepository.delete).not.toHaveBeenCalled();
    expect(optionRepository.save).toHaveBeenCalled();
  });

  it('replaces existing questions and options when updating a quiz definition', async () => {
    const { deps, depsQuizRepository } = createDependencies();
    const quizRepository = createRepository<Quiz>();
    const questionRepository = createRepository<QuizQuestion>();
    const optionRepository = createRepository<QuizOption>();

    depsQuizRepository.manager.transaction.mockImplementation(
      (callback: TransactionCallback) =>
        callback({
          getRepository: <Entity>(entity: new () => Entity): Entity => {
            if (entity === Quiz) {
              return quizRepository as unknown as Entity;
            }
            if (entity === QuizQuestion) {
              return questionRepository as unknown as Entity;
            }
            return optionRepository as unknown as Entity;
          },
        }),
    );
    quizRepository.findOne.mockResolvedValue({ id: 'quiz-1' } as Quiz);
    quizRepository.save.mockResolvedValue({ id: 'quiz-1' } as Quiz);
    questionRepository.find.mockResolvedValue([
      { id: 'old-question-1' } as QuizQuestion,
    ]);
    questionRepository.save.mockResolvedValue({
      id: 'question-1',
    } as QuizQuestion);

    await upsertQuizDefinition(deps, createDto(), {
      scope: QuizScope.CHAPTER_TRAINING,
      chapterId: 'chapter-1',
      courseId: null,
    });

    expect(optionRepository.delete).toHaveBeenCalled();
    expect(questionRepository.delete).toHaveBeenCalledWith({
      quizId: 'quiz-1',
    });
  });

  it('uses the course id lookup branch for course final tests', async () => {
    const { deps, depsQuizRepository } = createDependencies();
    const quizRepository = createRepository<Quiz>();
    const questionRepository = createRepository<QuizQuestion>();
    const optionRepository = createRepository<QuizOption>();

    depsQuizRepository.manager.transaction.mockImplementation(
      (callback: TransactionCallback) =>
        callback({
          getRepository: <Entity>(entity: new () => Entity): Entity => {
            if (entity === Quiz) {
              return quizRepository as unknown as Entity;
            }
            if (entity === QuizQuestion) {
              return questionRepository as unknown as Entity;
            }
            return optionRepository as unknown as Entity;
          },
        }),
    );
    quizRepository.findOne.mockResolvedValue(null);
    quizRepository.save.mockResolvedValue({ id: 'final-test-1' } as Quiz);
    questionRepository.find.mockResolvedValue([]);
    questionRepository.save.mockResolvedValue({
      id: 'question-1',
    } as QuizQuestion);

    await upsertQuizDefinition(deps, createDto(), {
      scope: QuizScope.COURSE_FINAL,
      chapterId: null,
      courseId: 'course-1',
    });

    expect(quizRepository.findOne).toHaveBeenCalledWith({
      where: { scope: QuizScope.COURSE_FINAL, courseId: 'course-1' },
    });
    expect(quizRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: QuizScope.COURSE_FINAL,
        chapterId: null,
        courseId: 'course-1',
      }),
    );
  });
});
