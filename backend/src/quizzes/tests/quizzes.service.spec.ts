import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { Chapter } from '../../entities/chapter.entity';
import { Course } from '../../entities/course.entity';
import { Progress } from '../../entities/progress.entity';
import { Quiz } from '../../entities/quiz.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import { QuizAttemptAnswer } from '../../entities/quiz-attempt-answer.entity';
import { QuizOption } from '../../entities/quiz-option.entity';
import { QuizQuestion } from '../../entities/quiz-question.entity';
import { QuizQuestionType } from '../../entities/quiz-question-type.enum';
import { QuizScope } from '../../entities/quiz-scope.enum';
import { UserPlan, UserRole } from '../../entities/user.entity';
import { CertificatesService } from '../../certificates/services/certificates.service';
import { QuizzesService } from '../services/quizzes.service';

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

const createChapter = (): Chapter =>
  Object.assign(new Chapter(), {
    id: 'chapter-1',
    courseId: 'course-1',
  });

const createCourse = (): Course =>
  Object.assign(new Course(), {
    id: 'course-1',
  });

const createFinalTestTree = (): Quiz =>
  Object.assign(new Quiz(), {
    id: 'final-test-1',
    scope: QuizScope.COURSE_FINAL,
    chapterId: null,
    courseId: 'course-1',
    titleEn: 'Final test',
    titleFi: 'Final test',
    descriptionEn: 'Course assessment',
    descriptionFi: 'Course assessment',
    passingScore: 80,
    isPublished: true,
    attempts: [],
    questions: [
      Object.assign(new QuizQuestion(), {
        id: 'question-1',
        quizId: 'final-test-1',
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
  });

const createChapterQuizTree = (): Quiz =>
  Object.assign(createFinalTestTree(), {
    id: 'quiz-1',
    scope: QuizScope.CHAPTER_TRAINING,
    chapterId: 'chapter-1',
    courseId: null,
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
  let certificatesService: {
    syncCourseCertificate: jest.Mock;
    getCourseCertificateStatus: jest.Mock;
  };

  beforeEach(async () => {
    chapterRepository = createMockRepository<Chapter>();
    courseRepository = createMockRepository<Course>();
    progressRepository = createMockRepository<Progress>();
    quizRepository = createMockRepository<Quiz>();
    questionRepository = createMockRepository<QuizQuestion>();
    optionRepository = createMockRepository<QuizOption>();
    attemptRepository = createMockRepository<QuizAttempt>();
    attemptAnswerRepository = createMockRepository<QuizAttemptAnswer>();
    certificatesService = {
      syncCourseCertificate: jest.fn(),
      getCourseCertificateStatus: jest.fn(),
    };

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
        { provide: getRepositoryToken(Chapter), useValue: chapterRepository },
        { provide: getRepositoryToken(Course), useValue: courseRepository },
        { provide: getRepositoryToken(Progress), useValue: progressRepository },
        { provide: getRepositoryToken(Quiz), useValue: quizRepository },
        {
          provide: getRepositoryToken(QuizQuestion),
          useValue: questionRepository,
        },
        { provide: getRepositoryToken(QuizOption), useValue: optionRepository },
        {
          provide: getRepositoryToken(QuizAttempt),
          useValue: attemptRepository,
        },
        {
          provide: getRepositoryToken(QuizAttemptAnswer),
          useValue: attemptAnswerRepository,
        },
        { provide: CertificatesService, useValue: certificatesService },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null for learners when a published chapter quiz does not exist yet', async () => {
    chapterRepository.findOne.mockResolvedValue(createChapter());
    quizRepository.findOne.mockResolvedValue(null);

    const result = await service.getChapterQuiz(
      'course-1',
      'chapter-1',
      createCurrentUser(),
    );

    expect(result).toBeNull();
  });

  it('returns the admin chapter quiz view when an admin requests it', async () => {
    chapterRepository.findOne.mockResolvedValue(createChapter());
    quizRepository.findOne.mockResolvedValue(
      Object.assign(createChapterQuizTree(), {
        attempts: [
          Object.assign(new QuizAttempt(), {
            id: 'attempt-1',
            quizId: 'quiz-1',
            userId: 12,
            totalQuestions: 1,
            correctAnswers: 1,
            score: 100,
            passed: true,
            submittedAt: new Date('2026-01-03T00:00:00.000Z'),
          }),
        ],
      }),
    );

    const result = await service.getChapterQuiz(
      'course-1',
      'chapter-1',
      createCurrentUser({ role: UserRole.ADMIN }),
    );

    expect(result).not.toBeNull();
    if (!result || !('stats' in result)) {
      throw new Error('Expected an admin chapter quiz view');
    }

    expect(result.id).toBe('quiz-1');
    expect(result.chapterId).toBe('chapter-1');
    expect(result.stats.attemptCount).toBe(1);
    expect(result.stats.bestScore).toBe(100);
  });

  it('upserts a chapter quiz and returns the saved admin view', async () => {
    chapterRepository.findOne.mockResolvedValue(createChapter());
    quizRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(
      Object.assign(createFinalTestTree(), {
        id: 'quiz-1',
        scope: QuizScope.CHAPTER_TRAINING,
        chapterId: 'chapter-1',
        courseId: null,
      }),
    );
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
  });

  it('throws when deleting a missing chapter quiz', async () => {
    chapterRepository.findOne.mockResolvedValue(createChapter());
    quizRepository.findOne.mockResolvedValue(null);

    await expect(
      service.deleteChapterQuiz('course-1', 'chapter-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns null for learners when a published course final test does not exist yet', async () => {
    courseRepository.findOne.mockResolvedValue(createCourse());
    quizRepository.findOne.mockResolvedValue(null);

    const result = await service.getCourseFinalTest(
      'course-1',
      createCurrentUser(),
    );

    expect(result).toBeNull();
  });

  it('returns the admin final test view when an admin requests it', async () => {
    courseRepository.findOne.mockResolvedValue(createCourse());
    quizRepository.findOne.mockResolvedValue(createFinalTestTree());

    const result = await service.getCourseFinalTest(
      'course-1',
      createCurrentUser({ role: UserRole.ADMIN }),
    );

    expect(result).not.toBeNull();
    if (!result || !('stats' in result)) {
      throw new Error('Expected an admin final test view');
    }

    expect(result.id).toBe('final-test-1');
    expect(result.courseId).toBe('course-1');
    expect(result.stats.attemptCount).toBe(0);
  });

  it('upserts a course final test and returns the saved admin view', async () => {
    courseRepository.findOne.mockResolvedValue(createCourse());
    quizRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createFinalTestTree());
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
    quizRepository.findOne.mockResolvedValue(createFinalTestTree());
    progressRepository.findOne.mockResolvedValue(createProgress(75, false));

    await expect(
      service.submitCourseFinalTestAttempt('course-1', createCurrentUser(), {
        answers: [
          { questionId: 'question-1', selectedOptionIds: ['option-1a'] },
        ],
      }),
    ).rejects.toThrow(
      'The final test unlocks only after the course is completed',
    );
  });

  it('submits a chapter quiz attempt after loading the chapter context', async () => {
    chapterRepository.findOne.mockResolvedValue(createChapter());
    quizRepository.findOne.mockResolvedValue(createChapterQuizTree());
    attemptRepository.save.mockResolvedValue(
      Object.assign(new QuizAttempt(), {
        id: 'attempt-1',
        quizId: 'quiz-1',
        userId: 12,
        totalQuestions: 1,
        correctAnswers: 1,
        score: 100,
        passed: true,
        submittedAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    );
    attemptRepository.find.mockResolvedValue([
      Object.assign(new QuizAttempt(), {
        id: 'attempt-1',
        quizId: 'quiz-1',
        userId: 12,
        totalQuestions: 1,
        correctAnswers: 1,
        score: 100,
        passed: true,
        submittedAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    ]);

    const result = await service.submitChapterQuizAttempt(
      'course-1',
      'chapter-1',
      12,
      {
        answers: [
          { questionId: 'question-1', selectedOptionIds: ['option-1a'] },
        ],
      },
    );

    expect(chapterRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'chapter-1', courseId: 'course-1' },
    });
    expect(result.attempt).toEqual(
      expect.objectContaining({
        id: 'attempt-1',
        score: 100,
        passed: true,
      }),
    );
  });

  it('throws when deleting a missing course final test', async () => {
    courseRepository.findOne.mockResolvedValue(createCourse());
    quizRepository.findOne.mockResolvedValue(null);

    await expect(service.deleteCourseFinalTest('course-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
