import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Chapter } from '../entities/chapter.entity';
import { Course } from '../entities/course.entity';
import { Progress } from '../entities/progress.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { QuizAttemptAnswer } from '../entities/quiz-attempt-answer.entity';
import { QuizOption } from '../entities/quiz-option.entity';
import { QuizQuestion } from '../entities/quiz-question.entity';
import { QuizQuestionType } from '../entities/quiz-question-type.enum';
import { QuizScope } from '../entities/quiz-scope.enum';
import { QuizzesService } from './quizzes.service';

type FindOneFn<T extends object> = (options?: unknown) => Promise<T | null>;
type FindFn<T extends object> = (options?: unknown) => Promise<T[]>;
type CreateFn<T extends object> = (entityLike?: Partial<T>) => T;
type SaveFn<T extends object> = (entity: T | T[]) => Promise<T | T[]>;
type DeleteFn = (criteria?: unknown) => Promise<unknown>;
type RemoveFn<T extends object> = (entity: T) => Promise<T>;

type TransactionCallback = (entityManager: {
  getRepository: <Entity>(entity: new () => Entity) => unknown;
}) => Promise<unknown>;

type MockRepository<T extends object> = {
  findOne: jest.MockedFunction<FindOneFn<T>>;
  find: jest.MockedFunction<FindFn<T>>;
  create: jest.MockedFunction<CreateFn<T>>;
  save: jest.MockedFunction<SaveFn<T>>;
  delete: jest.MockedFunction<DeleteFn>;
  remove: jest.MockedFunction<RemoveFn<T>>;
  manager?: {
    transaction: jest.MockedFunction<
      (callback: TransactionCallback) => Promise<unknown>
    >;
  };
};

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  findOne: jest.fn<FindOneFn<T>>(),
  find: jest.fn<FindFn<T>>(),
  create: jest.fn<CreateFn<T>>((entityLike?: Partial<T>) =>
    Object.assign({} as T, entityLike),
  ),
  save: jest.fn<SaveFn<T>>((entity: T | T[]) => Promise.resolve(entity)),
  delete: jest.fn<DeleteFn>(() => Promise.resolve({})),
  remove: jest.fn<RemoveFn<T>>((entity: T) => Promise.resolve(entity)),
});

const createChapter = (): Chapter =>
  Object.assign(new Chapter(), {
    id: 'chapter-1',
    courseId: 'course-1',
  });

const createCourse = (): Course =>
  Object.assign(new Course(), {
    id: 'course-1',
  });

const createProgress = (
  completionPercentage: number,
  completed = false,
): Progress =>
  Object.assign(new Progress(), {
    id: 'progress-1',
    userId: 12,
    courseId: 'course-1',
    completionPercentage,
    completed,
  });

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
            id: 'option-2a',
            questionId: 'question-2',
            labelEn: 'Correct A',
            labelFi: 'Correct A',
            isCorrect: true,
            orderIndex: 1,
          }),
          Object.assign(new QuizOption(), {
            id: 'option-2b',
            questionId: 'question-2',
            labelEn: 'Correct B',
            labelFi: 'Correct B',
            isCorrect: true,
            orderIndex: 2,
          }),
          Object.assign(new QuizOption(), {
            id: 'option-2c',
            questionId: 'question-2',
            labelEn: 'Wrong',
            labelFi: 'Wrong',
            isCorrect: false,
            orderIndex: 3,
          }),
        ],
      }),
    ],
    attempts: [],
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

describe('QuizzesService', () => {
  let service: QuizzesService;
  let chapterRepository: MockRepository<Chapter>;
  let courseRepository: MockRepository<Course>;
  let progressRepository: MockRepository<Progress>;
  let quizRepository: MockRepository<Quiz>;
  let questionRepository: MockRepository<QuizQuestion>;
  let optionRepository: MockRepository<QuizOption>;
  let attemptRepository: MockRepository<QuizAttempt>;
  let attemptAnswerRepository: MockRepository<QuizAttemptAnswer>;

  beforeEach(async () => {
    chapterRepository = createMockRepository<Chapter>();
    courseRepository = createMockRepository<Course>();
    progressRepository = createMockRepository<Progress>();
    quizRepository = createMockRepository<Quiz>();
    questionRepository = createMockRepository<QuizQuestion>();
    optionRepository = createMockRepository<QuizOption>();
    attemptRepository = createMockRepository<QuizAttempt>();
    attemptAnswerRepository = createMockRepository<QuizAttemptAnswer>();

    const repositoryMap = new Map<unknown, unknown>([
      [Quiz, quizRepository],
      [QuizQuestion, questionRepository],
      [QuizOption, optionRepository],
    ]);

    quizRepository.manager = {
      transaction: jest.fn(async (callback: TransactionCallback) =>
        callback({
          getRepository: <Entity>(entity: new () => Entity) =>
            repositoryMap.get(entity) as Entity,
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        {
          provide: getRepositoryToken(Chapter),
          useValue: chapterRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
        {
          provide: getRepositoryToken(Progress),
          useValue: progressRepository,
        },
        {
          provide: getRepositoryToken(Quiz),
          useValue: quizRepository,
        },
        {
          provide: getRepositoryToken(QuizQuestion),
          useValue: questionRepository,
        },
        {
          provide: getRepositoryToken(QuizOption),
          useValue: optionRepository,
        },
        {
          provide: getRepositoryToken(QuizAttempt),
          useValue: attemptRepository,
        },
        {
          provide: getRepositoryToken(QuizAttemptAnswer),
          useValue: attemptAnswerRepository,
        },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null for learners when a published quiz does not exist yet', async () => {
    chapterRepository.findOne.mockResolvedValue(createChapter());
    quizRepository.findOne.mockResolvedValue(null);

    const result = await service.getChapterQuiz('course-1', 'chapter-1', {
      id: 12,
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Example',
      occupation: null,
      role: 'USER' as never,
      plan: 'FREE' as never,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(result).toBeNull();
  });

  it('upserts a chapter quiz and returns the saved admin view', async () => {
    chapterRepository.findOne.mockResolvedValue(createChapter());
    quizRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createQuizTree());
    questionRepository.find.mockResolvedValue([]);

    const result = await service.upsertChapterQuiz('course-1', 'chapter-1', {
      titleEn: 'Foundations quiz',
      titleFi: 'Foundations quiz',
      descriptionEn: 'Quiz',
      descriptionFi: 'Quiz',
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

    expect(quizRepository.manager?.transaction).toHaveBeenCalled();
    expect(result.id).toBe('quiz-1');
    expect(result.questions).toHaveLength(2);
  });

  it('scores and stores a successful learner attempt', async () => {
    chapterRepository.findOne.mockResolvedValue(createChapter());
    quizRepository.findOne.mockResolvedValue(createQuizTree());
    attemptRepository.save.mockResolvedValue(createAttempt(100, true));
    attemptAnswerRepository.save.mockResolvedValue([]);
    attemptRepository.find.mockResolvedValue([
      createAttempt(100, true),
      createAttempt(50, false),
    ]);

    const result = await service.submitChapterQuizAttempt(
      'course-1',
      'chapter-1',
      12,
      {
        answers: [
          {
            questionId: 'question-1',
            selectedOptionIds: ['option-1a'],
          },
          {
            questionId: 'question-2',
            selectedOptionIds: ['option-2a', 'option-2b'],
          },
        ],
      },
    );

    expect(result.attempt.score).toBe(100);
    expect(result.attempt.passed).toBe(true);
    expect(result.bestAttempt.score).toBe(100);
    expect(attemptAnswerRepository.save).toHaveBeenCalled();
  });

  it('throws when deleting a chapter quiz that does not exist', async () => {
    chapterRepository.findOne.mockResolvedValue(createChapter());
    quizRepository.findOne.mockResolvedValue(null);

    await expect(
      service.deleteChapterQuiz('course-1', 'chapter-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('upserts a course final test and returns the saved admin view', async () => {
    const finalTest = Object.assign(createQuizTree(), {
      id: 'final-test-1',
      scope: QuizScope.COURSE_FINAL,
      chapterId: null,
      courseId: 'course-1',
      attempts: [],
    });

    courseRepository.findOne.mockResolvedValue(createCourse());
    quizRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(finalTest);
    questionRepository.find.mockResolvedValue([]);

    const result = await service.upsertCourseFinalTest('course-1', {
      titleEn: 'Final test',
      titleFi: 'Final test',
      descriptionEn: 'Course assessment',
      descriptionFi: 'Course assessment',
      passingScore: 80,
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

    expect(quizRepository.manager?.transaction).toHaveBeenCalled();
    expect(result.id).toBe('final-test-1');
    expect(result.courseId).toBe('course-1');
  });

  it('blocks final test attempts until the course is completed', async () => {
    courseRepository.findOne.mockResolvedValue(createCourse());
    quizRepository.findOne.mockResolvedValue(
      Object.assign(createQuizTree(), {
        id: 'final-test-1',
        scope: QuizScope.COURSE_FINAL,
        chapterId: null,
        courseId: 'course-1',
      }),
    );
    progressRepository.findOne.mockResolvedValue(createProgress(75, false));

    await expect(
      service.submitCourseFinalTestAttempt(
        'course-1',
        {
          id: 12,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Example',
          occupation: null,
          role: 'USER' as never,
          plan: 'FREE' as never,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          answers: [
            {
              questionId: 'question-1',
              selectedOptionIds: ['option-1a'],
            },
          ],
        },
      ),
    ).rejects.toThrow(
      'The final test unlocks only after the course is completed',
    );
  });
});
