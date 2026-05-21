import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { Author } from '../../entities/author.entity';
import {
  Course,
  CourseLevel,
  CourseStatus,
} from '../../entities/course.entity';
import { Progress } from '../../entities/progress.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import { Quiz } from '../../entities/quiz.entity';
import { QuizScope } from '../../entities/quiz-scope.enum';
import { User, UserPlan, UserRole } from '../../entities/user.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CourseService } from './course.service';

type MockCourseRepository = Pick<
  Repository<Course>,
  'count' | 'find' | 'findAndCount' | 'findOne' | 'create' | 'save' | 'remove'
> & {
  count: jest.Mock;
  find: jest.Mock;
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
};

type MockAuthorRepository = Pick<Repository<Author>, 'find'> & {
  find: jest.Mock;
};

type MockUserRepository = Pick<Repository<User>, 'find'> & {
  find: jest.Mock;
};

type MockProgressRepository = Pick<Repository<Progress>, 'find'> & {
  find: jest.Mock;
};

type MockQuizRepository = Pick<Repository<Quiz>, 'find'> & {
  find: jest.Mock;
};

type MockQuizAttemptRepository = Pick<Repository<QuizAttempt>, 'find'> & {
  find: jest.Mock;
};

const createAuthor = (
  id: string = '550e8400-e29b-41d4-a716-446655440001',
  ownerUserId: number | null = 1,
): Author =>
  ({
    id,
    name: 'Said Ait Baha',
    roleEn: 'Cybersecurity Trainer',
    roleFi: 'Kyberturvallisuuden kouluttaja',
    biographyEn: 'Hands-on offensive security specialist.',
    biographyFi: 'Kaytannonlaheinen tietoturvan asiantuntija.',
    photo: '/uploads/authors/said.jpg',
    ownerUserId,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  }) as Author;

const createCourse = (overrides: Partial<Course> = {}): Course =>
  ({
    id: 'course-1',
    slugEn: 'course-en',
    slugFi: 'course-fi',
    titleEn: 'Course EN',
    titleFi: 'Course FI',
    descriptionEn: 'Description EN',
    descriptionFi: 'Description FI',
    level: CourseLevel.FREE,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 60,
    coverImage: '/cover.jpg',
    ownerUserId: null,
    createdByUserId: null,
    lastEditedByUserId: null,
    publishedByUserId: null,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    authors: [],
    finalTests: [],
    chapters: [
      {
        id: 'chapter-2',
        titleEn: 'Chapter 2',
        titleFi: 'Luku 2',
        descriptionEn: 'Description 2',
        descriptionFi: 'Kuvaus 2',
        orderIndex: 2,
        courseId: 'course-1',
        course: undefined,
        trainingQuiz: null,
        subChapters: [
          {
            id: 'sub-2',
            titleEn: 'Sub 2',
            titleFi: 'Alaluku 2',
            descriptionEn: 'Sub desc 2',
            descriptionFi: 'Alakuvan 2',
            orderIndex: 2,
            chapterId: 'chapter-2',
            chapter: undefined,
            pedagogicalContents: [
              {
                id: 'content-2',
                titleEn: 'Content 2',
                titleFi: 'Sisalto 2',
                type: 'text',
                contentEn: 'Two',
                contentFi: 'Kaksi',
                url: null,
                orderIndex: 2,
              },
              {
                id: 'content-1',
                titleEn: 'Content 1',
                titleFi: 'Sisalto 1',
                type: 'text',
                contentEn: 'One',
                contentFi: 'Yksi',
                url: null,
                orderIndex: 1,
              },
            ],
          },
          {
            id: 'sub-1',
            titleEn: 'Sub 1',
            titleFi: 'Alaluku 1',
            descriptionEn: 'Sub desc 1',
            descriptionFi: 'Alakuvan 1',
            orderIndex: 1,
            chapterId: 'chapter-2',
            chapter: undefined,
            pedagogicalContents: [],
          },
        ],
      },
      {
        id: 'chapter-1',
        titleEn: 'Chapter 1',
        titleFi: 'Luku 1',
        descriptionEn: 'Description 1',
        descriptionFi: 'Kuvaus 1',
        orderIndex: 1,
        courseId: 'course-1',
        course: undefined,
        trainingQuiz: null,
        subChapters: [],
      },
    ],
    ...overrides,
  }) as Course;

const createCourseDto = (
  overrides: Partial<CreateCourseDto> = {},
): CreateCourseDto => ({
  titleEn: 'Course EN',
  titleFi: 'Course FI',
  descriptionEn: 'Description EN',
  descriptionFi: 'Description FI',
  level: CourseLevel.FREE,
  status: CourseStatus.DRAFT,
  estimatedDuration: 60,
  coverImage: '/cover.jpg',
  ...overrides,
});

describe('CourseService', () => {
  let service: CourseService;
  let courseRepository: MockCourseRepository;
  let authorRepository: MockAuthorRepository;
  let progressRepository: MockProgressRepository;
  let quizRepository: MockQuizRepository;
  let quizAttemptRepository: MockQuizAttemptRepository;
  let userRepository: MockUserRepository;
  const adminUser: SafeUser = {
    id: 1,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    occupation: null,
    role: UserRole.ADMIN,
    plan: UserPlan.PREMIUM,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const creatorUser: SafeUser = {
    id: 8,
    email: 'creator@example.com',
    firstName: 'Creator',
    lastName: 'User',
    occupation: null,
    role: UserRole.CREATOR,
    plan: UserPlan.FREE,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const notificationsService = {
    notifyCoursePublished: jest.fn(),
    deleteCourseNotifications: jest.fn(),
  };

  beforeEach(async () => {
    courseRepository = {
      count: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    authorRepository = {
      find: jest.fn(),
    };

    progressRepository = {
      find: jest.fn(),
    };

    quizRepository = {
      find: jest.fn(),
    };

    quizAttemptRepository = {
      find: jest.fn(),
    };

    userRepository = {
      find: jest.fn(),
    };
    userRepository.find.mockResolvedValue([]);
    progressRepository.find.mockResolvedValue([]);
    quizRepository.find.mockResolvedValue([]);
    quizAttemptRepository.find.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
        {
          provide: getRepositoryToken(Author),
          useValue: authorRepository,
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
          provide: getRepositoryToken(QuizAttempt),
          useValue: quizAttemptRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a draft course without authors and skips notifications', async () => {
      const dto = createCourseDto();
      const createdCourse = createCourse({ status: CourseStatus.DRAFT });

      courseRepository.create.mockReturnValue(createdCourse);
      courseRepository.save.mockResolvedValue(createdCourse);

      const result = await service.create(dto, adminUser);

      // Only course fields should be sent to create because author ids are resolved separately.
      expect(courseRepository.create).toHaveBeenCalledWith({
        slugEn: 'course-en',
        slugFi: 'course-fi',
        titleEn: dto.titleEn,
        titleFi: dto.titleFi,
        descriptionEn: dto.descriptionEn,
        descriptionFi: dto.descriptionFi,
        level: dto.level,
        status: dto.status,
        estimatedDuration: dto.estimatedDuration,
        coverImage: dto.coverImage,
        ownerUserId: adminUser.id,
        createdByUserId: adminUser.id,
        lastEditedByUserId: adminUser.id,
        publishedByUserId: null,
        publishedAt: null,
      });
      expect(authorRepository.find).not.toHaveBeenCalled();
      expect(notificationsService.notifyCoursePublished).not.toHaveBeenCalled();
      expect(result).toEqual(createdCourse);
    });

    it('creates a published course with resolved authors and sends a notification', async () => {
      const dto = createCourseDto({
        status: CourseStatus.PUBLISHED,
        authorIds: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
      });
      const authors = [
        createAuthor('550e8400-e29b-41d4-a716-446655440001', adminUser.id),
        createAuthor('550e8400-e29b-41d4-a716-446655440002', adminUser.id),
      ];
      const createdCourse = createCourse({
        status: CourseStatus.PUBLISHED,
        authors,
      });

      courseRepository.create.mockReturnValue(createdCourse);
      authorRepository.find.mockResolvedValue(authors);
      courseRepository.save.mockResolvedValue(createdCourse);

      const result = await service.create(dto, adminUser);

      expect(authorRepository.find).toHaveBeenCalledWith({
        where: [
          {
            id: expect.anything(),
            ownerUserId: adminUser.id,
          },
          {
            id: expect.anything(),
            ownerUserId: expect.anything(),
          },
        ],
      });
      expect(createdCourse.authors).toEqual(authors);
      expect(notificationsService.notifyCoursePublished).toHaveBeenCalledWith(
        createdCourse,
      );
      expect(result).toEqual(createdCourse);
    });

    it('throws when one or more provided authors do not exist', async () => {
      const dto = createCourseDto({
        authorIds: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
      });
      courseRepository.create.mockReturnValue(createCourse());
      authorRepository.find.mockResolvedValue([
        createAuthor('550e8400-e29b-41d4-a716-446655440001', adminUser.id),
      ]);

      await expect(service.create(dto, adminUser)).rejects.toThrow(
        NotFoundException,
      );

      expect(courseRepository.save).not.toHaveBeenCalled();
      expect(notificationsService.notifyCoursePublished).not.toHaveBeenCalled();
    });

    it('assigns creator-owned courses to the current creator', async () => {
      const dto = createCourseDto();
      const createdCourse = createCourse({
        status: CourseStatus.DRAFT,
        ownerUserId: creatorUser.id,
      });

      courseRepository.create.mockReturnValue(createdCourse);
      courseRepository.save.mockResolvedValue(createdCourse);

      await service.create(dto, creatorUser);

      expect(courseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerUserId: creatorUser.id,
          createdByUserId: creatorUser.id,
          lastEditedByUserId: creatorUser.id,
        }),
      );
    });

    it('adds a numeric suffix when the generated slug is already taken', async () => {
      const dto = createCourseDto();
      const createdCourse = createCourse({
        slugEn: 'course-en-2',
      });

      courseRepository.findOne
        .mockResolvedValueOnce(createCourse({ id: 'existing-course' }))
        .mockResolvedValueOnce(null);
      courseRepository.create.mockReturnValue(createdCourse);
      courseRepository.save.mockResolvedValue(createdCourse);

      await service.create(dto, adminUser);

      expect(courseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slugEn: 'course-en-2',
          slugFi: 'course-fi',
        }),
      );
    });
  });

  describe('findAll', () => {
    // Verifies that the public course list is returned already sorted for chapters and subchapters.
    it('sorts chapters and subchapters before returning published courses', async () => {
      courseRepository.findAndCount.mockResolvedValue([[createCourse()], 1]);

      const [courses, count] = await service.findAll(20, 0);

      expect(count).toBe(1);
      expect(courses[0].chapters.map((chapter) => chapter.id)).toEqual([
        'chapter-1',
        'chapter-2',
      ]);
      expect(
        courses[0].chapters[1].subChapters.map((subChapter) => subChapter.id),
      ).toEqual(['sub-1', 'sub-2']);
      expect(courseRepository.findAndCount).toHaveBeenCalledWith({
        where: { status: CourseStatus.PUBLISHED },
        relations: [
          'authors',
          'finalTests',
          'chapters',
          'chapters.trainingQuiz',
          'chapters.subChapters',
        ],
        take: 20,
        skip: 0,
        order: { createdAt: 'DESC' },
      });
    });

    it('uses default pagination values when none are provided', async () => {
      courseRepository.findAndCount.mockResolvedValue([[createCourse()], 1]);

      await service.findAll();

      expect(courseRepository.findAndCount).toHaveBeenCalledWith({
        where: { status: CourseStatus.PUBLISHED },
        relations: [
          'authors',
          'finalTests',
          'chapters',
          'chapters.trainingQuiz',
          'chapters.subChapters',
        ],
        take: 10,
        skip: 0,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findAllForAdmin', () => {
    it('sorts courses for admin pages and uses updatedAt ordering', async () => {
      courseRepository.findAndCount.mockResolvedValue([[createCourse()], 1]);

      const [courses, count] = await service.findAllForAdmin(
        20,
        0,
        adminUser,
      );

      expect(count).toBe(1);
      expect(courses[0].chapters.map((chapter) => chapter.id)).toEqual([
        'chapter-1',
        'chapter-2',
      ]);
      expect(courseRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.any(Array),
        relations: [
          'authors',
          'finalTests',
          'chapters',
          'chapters.trainingQuiz',
          'chapters.subChapters',
        ],
        take: 20,
        skip: 0,
        order: { updatedAt: 'DESC' },
      });
    });

    it('attaches safe owner metadata in admin review scope', async () => {
      courseRepository.findAndCount.mockResolvedValue([
        [createCourse({ ownerUserId: creatorUser.id })],
        1,
      ]);
      userRepository.find.mockResolvedValue([
        {
          id: creatorUser.id,
          email: creatorUser.email,
          firstName: creatorUser.firstName,
          lastName: creatorUser.lastName,
        },
      ]);

      const [courses] = await service.findAllForAdmin(20, 0, adminUser, 'review');

      expect(userRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });
      expect(courses[0]).toEqual(
        expect.objectContaining({
          owner: {
            id: creatorUser.id,
            email: creatorUser.email,
            firstName: creatorUser.firstName,
            lastName: creatorUser.lastName,
          },
        }),
      );
    });

    it('uses a dedicated review scope for courses not owned by the admin', async () => {
      courseRepository.findAndCount.mockResolvedValue([[createCourse()], 1]);

      await service.findAllForAdmin(20, 0, adminUser, 'review');

      expect(courseRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          ownerUserId: expect.anything(),
        }),
        relations: [
          'authors',
          'finalTests',
          'chapters',
          'chapters.trainingQuiz',
          'chapters.subChapters',
        ],
        take: 20,
        skip: 0,
        order: { updatedAt: 'DESC' },
      });
    });

    it('filters creator course lists to owned courses only', async () => {
      courseRepository.findAndCount.mockResolvedValue([[createCourse()], 1]);

      await service.findAllForAdmin(20, 0, creatorUser);

      expect(courseRepository.findAndCount).toHaveBeenCalledWith({
        where: { ownerUserId: creatorUser.id },
        relations: [
          'authors',
          'finalTests',
          'chapters',
          'chapters.trainingQuiz',
          'chapters.subChapters',
        ],
        take: 20,
        skip: 0,
        order: { updatedAt: 'DESC' },
      });
    });

    it('attaches per-course learning metrics for the course library cards', async () => {
      courseRepository.findAndCount.mockResolvedValue([
        [createCourse({ ownerUserId: creatorUser.id })],
        1,
      ]);
      progressRepository.find.mockResolvedValue([
        {
          userId: 50,
          courseId: 'course-1',
          completionPercentage: 40,
          completed: false,
        },
        {
          userId: 51,
          courseId: 'course-1',
          completionPercentage: 100,
          completed: true,
        },
      ]);
      quizRepository.find.mockResolvedValue([
        {
          id: 'quiz-final-1',
          scope: QuizScope.COURSE_FINAL,
          courseId: 'course-1',
        },
      ]);
      quizAttemptRepository.find.mockResolvedValue([
        { quizId: 'quiz-final-1', passed: true },
        { quizId: 'quiz-final-1', passed: false },
      ]);

      const [courses] = await service.findAllForAdmin(20, 0, creatorUser);

      expect(courses[0]).toEqual(
        expect.objectContaining({
          learningSummary: {
            startedLearners: 2,
            completedLearners: 1,
            averageProgress: 70,
            finalTestAttempts: 2,
            finalTestPassRate: 50,
          },
        }),
      );
    });
  });

  describe('getAdminSummary', () => {
    it('returns separate totals for published and draft courses', async () => {
      courseRepository.count
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(7);

      const result = await service.getAdminSummary(adminUser);

      expect(courseRepository.count).toHaveBeenNthCalledWith(1, {
        where: expect.any(Array),
      });
      expect(courseRepository.count).toHaveBeenNthCalledWith(2, {
        where: expect.any(Array),
      });
      expect(courseRepository.count).toHaveBeenNthCalledWith(3, {
        where: expect.any(Array),
      });
      expect(result).toEqual({
        totalCourses: 12,
        publishedCourses: 5,
        draftCourses: 7,
      });
    });

    it('uses a separate review scope for admin supervision metrics', async () => {
      courseRepository.count
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(2);

      await service.getAdminSummary(adminUser, 'review');

      expect(courseRepository.count).toHaveBeenNthCalledWith(1, {
        where: expect.objectContaining({
          ownerUserId: expect.anything(),
        }),
      });
      expect(courseRepository.count).toHaveBeenNthCalledWith(2, {
        where: expect.objectContaining({
          ownerUserId: expect.anything(),
          status: CourseStatus.PUBLISHED,
        }),
      });
      expect(courseRepository.count).toHaveBeenNthCalledWith(3, {
        where: expect.objectContaining({
          ownerUserId: expect.anything(),
          status: CourseStatus.DRAFT,
        }),
      });
    });

    it('filters creator summary counts to owned courses only', async () => {
      courseRepository.count
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(3);

      await service.getAdminSummary(creatorUser);

      expect(courseRepository.count).toHaveBeenNthCalledWith(1, {
        where: { ownerUserId: creatorUser.id },
      });
      expect(courseRepository.count).toHaveBeenNthCalledWith(2, {
        where: {
          ownerUserId: creatorUser.id,
          status: CourseStatus.PUBLISHED,
        },
      });
      expect(courseRepository.count).toHaveBeenNthCalledWith(3, {
        where: {
          ownerUserId: creatorUser.id,
          status: CourseStatus.DRAFT,
        },
      });
    });
  });

  describe('getLearningSummary', () => {
    it('returns learner and final test analytics for owned creator courses', async () => {
      courseRepository.find.mockResolvedValue([
        createCourse({ ownerUserId: creatorUser.id }),
      ]);
      progressRepository.find.mockResolvedValue([
        {
          userId: 41,
          courseId: 'course-1',
          completionPercentage: 35,
          completed: false,
        },
        {
          userId: 42,
          courseId: 'course-1',
          completionPercentage: 100,
          completed: true,
        },
        {
          userId: 41,
          courseId: 'course-1',
          completionPercentage: 80,
          completed: false,
        },
      ]);
      quizRepository.find.mockResolvedValue([
        {
          id: 'quiz-final-1',
          scope: QuizScope.COURSE_FINAL,
          courseId: 'course-1',
        },
      ]);
      quizAttemptRepository.find.mockResolvedValue([
        { quizId: 'quiz-final-1', passed: true },
        { quizId: 'quiz-final-1', passed: false },
        { quizId: 'quiz-final-1', passed: true },
      ]);

      const result = await service.getLearningSummary(creatorUser);

      expect(courseRepository.find).toHaveBeenCalledWith({
        where: { ownerUserId: creatorUser.id },
      });
      expect(progressRepository.find).toHaveBeenCalledWith({
        where: { courseId: expect.anything() },
      });
      expect(result).toEqual({
        startedLearners: 2,
        completedLearners: 1,
        averageProgress: 72,
        finalTestAttempts: 3,
        finalTestPassRate: 67,
      });
    });

    it('returns empty analytics when no courses match the scope', async () => {
      courseRepository.find.mockResolvedValue([]);

      const result = await service.getLearningSummary(creatorUser);

      expect(result).toEqual({
        startedLearners: 0,
        completedLearners: 0,
        averageProgress: null,
        finalTestAttempts: 0,
        finalTestPassRate: null,
      });
      expect(progressRepository.find).not.toHaveBeenCalled();
      expect(quizRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    // Verifies that the detail endpoint returns a fully sorted tree, including pedagogical content order.
    it('sorts the full course tree including pedagogical contents', async () => {
      courseRepository.findOne.mockResolvedValue(createCourse());

      const course = await service.findById('course-1');

      expect(course.chapters.map((chapter) => chapter.id)).toEqual([
        'chapter-1',
        'chapter-2',
      ]);
      expect(
        course.chapters[1].subChapters.map((subChapter) => subChapter.id),
      ).toEqual(['sub-1', 'sub-2']);
      expect(
        course.chapters[1].subChapters[1].pedagogicalContents.map(
          (content) => content.id,
        ),
      ).toEqual(['content-1', 'content-2']);
      expect(courseRepository.findOne).toHaveBeenCalledWith({
        where: [
          { id: 'course-1', status: CourseStatus.PUBLISHED },
          { slugEn: 'course-1', status: CourseStatus.PUBLISHED },
          { slugFi: 'course-1', status: CourseStatus.PUBLISHED },
        ],
        relations: [
          'authors',
          'finalTests',
          'chapters',
          'chapters.trainingQuiz',
          'chapters.subChapters',
          'chapters.subChapters.pedagogicalContents',
        ],
      });
    });

    it('finds published courses by slug as well as by id', async () => {
      courseRepository.findOne.mockResolvedValue(
        createCourse({
          slugEn: 'incident-response-forensics',
          slugFi: 'poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka',
        }),
      );

      const course = await service.findById('incident-response-forensics');

      expect(course.slugEn).toBe('incident-response-forensics');
      expect(course.slugFi).toBe(
        'poikkeamiin-vastaaminen-ja-digitaalinen-forensiikka',
      );
      expect(courseRepository.findOne).toHaveBeenCalledWith({
        where: [
          {
            id: 'incident-response-forensics',
            status: CourseStatus.PUBLISHED,
          },
          {
            slugEn: 'incident-response-forensics',
            status: CourseStatus.PUBLISHED,
          },
          {
            slugFi: 'incident-response-forensics',
            status: CourseStatus.PUBLISHED,
          },
        ],
        relations: [
          'authors',
          'finalTests',
          'chapters',
          'chapters.trainingQuiz',
          'chapters.subChapters',
          'chapters.subChapters.pedagogicalContents',
        ],
      });
    });

    // Verifies the not-found case so the service throws the expected NestJS exception.
    it('throws NotFoundException when the course does not exist', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('missing-course')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByIdForAdmin', () => {
    it('attaches owner and learning summary metadata for admin detail views', async () => {
      const course = createCourse({ ownerUserId: creatorUser.id });
      courseRepository.findOne.mockResolvedValue(course);
      userRepository.find.mockResolvedValue([
        {
          id: creatorUser.id,
          email: creatorUser.email,
          firstName: creatorUser.firstName,
          lastName: creatorUser.lastName,
        },
      ]);
      progressRepository.find.mockResolvedValue([
        {
          userId: 99,
          courseId: course.id,
          completionPercentage: 100,
          completed: true,
        },
      ]);
      quizRepository.find.mockResolvedValue([
        {
          id: 'quiz-final-1',
          scope: QuizScope.COURSE_FINAL,
          courseId: course.id,
        },
      ]);
      quizAttemptRepository.find.mockResolvedValue([
        { quizId: 'quiz-final-1', passed: true },
      ]);

      const result = await service.findByIdForAdmin(course.id, adminUser);

      expect(result).toEqual(
        expect.objectContaining({
          owner: {
            id: creatorUser.id,
            email: creatorUser.email,
            firstName: creatorUser.firstName,
            lastName: creatorUser.lastName,
          },
          learningSummary: {
            startedLearners: 1,
            completedLearners: 1,
            averageProgress: 100,
            finalTestAttempts: 1,
            finalTestPassRate: 100,
          },
        }),
      );
    });
  });

  describe('update', () => {
    it('publishes a previously draft course and notifies subscribers', async () => {
      const existingCourse = createCourse({ status: CourseStatus.DRAFT });
      const savedCourse = createCourse({
        status: CourseStatus.PUBLISHED,
        titleEn: 'Updated Course EN',
        titleFi: 'Paivitetty kurssi',
        slugEn: 'updated-course-en',
        slugFi: 'paivitetty-kurssi',
      });
      const dto: UpdateCourseDto = {
        titleEn: 'Updated Course EN',
        titleFi: 'Paivitetty kurssi',
        status: CourseStatus.PUBLISHED,
      };

      courseRepository.findOne
        .mockResolvedValueOnce(existingCourse)
        .mockResolvedValueOnce(null);
      courseRepository.save.mockResolvedValue(savedCourse);

      const result = await service.update(existingCourse.id, dto, adminUser);

      expect(courseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: existingCourse.id,
          slugEn: 'updated-course-en',
          slugFi: 'paivitetty-kurssi',
          titleEn: 'Updated Course EN',
          status: CourseStatus.PUBLISHED,
          lastEditedByUserId: adminUser.id,
          publishedByUserId: adminUser.id,
          publishedAt: expect.any(Date),
        }),
      );
      expect(notificationsService.notifyCoursePublished).toHaveBeenCalledWith(
        savedCourse,
      );
      expect(
        notificationsService.deleteCourseNotifications,
      ).not.toHaveBeenCalled();
      expect(result).toEqual(savedCourse);
    });

    it('clears authors when update receives an empty author id list', async () => {
      const existingCourse = createCourse({
        status: CourseStatus.DRAFT,
        authors: [createAuthor()],
      });
      const savedCourse = createCourse({
        status: CourseStatus.DRAFT,
        authors: [],
      });

      courseRepository.findOne.mockResolvedValue(existingCourse);
      courseRepository.save.mockResolvedValue(savedCourse);

      const result = await service.update(
        existingCourse.id,
        { authorIds: [] },
        adminUser,
      );

      expect(authorRepository.find).not.toHaveBeenCalled();
      expect(courseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: existingCourse.id,
          authors: [],
        }),
      );
      expect(result.authors).toEqual([]);
    });

    it('removes notifications when a published course becomes a draft', async () => {
      const existingCourse = createCourse({ status: CourseStatus.PUBLISHED });
      const savedCourse = createCourse({ status: CourseStatus.DRAFT });

      courseRepository.findOne.mockResolvedValue(existingCourse);
      courseRepository.save.mockResolvedValue(savedCourse);

      const result = await service.update(
        existingCourse.id,
        {
          status: CourseStatus.DRAFT,
        },
        adminUser,
      );

      expect(
        notificationsService.deleteCourseNotifications,
      ).toHaveBeenCalledWith(savedCourse.id);
      expect(notificationsService.notifyCoursePublished).not.toHaveBeenCalled();
      expect(result).toEqual(savedCourse);
    });

    it('throws when update receives author ids that cannot all be resolved', async () => {
      const existingCourse = createCourse({ status: CourseStatus.DRAFT });

      courseRepository.findOne.mockResolvedValue(existingCourse);
      authorRepository.find.mockResolvedValue([
        createAuthor('550e8400-e29b-41d4-a716-446655440001', adminUser.id),
      ]);

      await expect(
        service.update(
          existingCourse.id,
          {
            authorIds: [
              '550e8400-e29b-41d4-a716-446655440001',
              '550e8400-e29b-41d4-a716-446655440002',
            ],
          },
          adminUser,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(courseRepository.save).not.toHaveBeenCalled();
    });

    it('blocks creators from attaching authors they do not own', async () => {
      const existingCourse = createCourse({
        status: CourseStatus.DRAFT,
        ownerUserId: creatorUser.id,
      });

      courseRepository.findOne.mockResolvedValue(existingCourse);
      authorRepository.find.mockResolvedValue([]);

      await expect(
        service.update(
          existingCourse.id,
          {
            authorIds: ['550e8400-e29b-41d4-a716-446655440001'],
          },
          creatorUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('blocks creators from updating courses they do not own', async () => {
      const existingCourse = createCourse({ ownerUserId: 999 });

      courseRepository.findOne.mockResolvedValue(existingCourse);

      await expect(
        service.update(existingCourse.id, { titleEn: 'Nope' }, creatorUser),
      ).rejects.toThrow(ForbiddenException);

      expect(courseRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('removes the course and deletes related notifications', async () => {
      const course = createCourse();

      courseRepository.findOne.mockResolvedValue(course);
      courseRepository.remove.mockResolvedValue(course);

      await service.delete(course.id, adminUser);

      expect(courseRepository.remove).toHaveBeenCalledWith(course);
      expect(
        notificationsService.deleteCourseNotifications,
      ).toHaveBeenCalledWith(course.id);
    });

    it('blocks creators from deleting courses they do not own', async () => {
      const course = createCourse({ ownerUserId: null });

      courseRepository.findOne.mockResolvedValue(course);

      await expect(service.delete(course.id, creatorUser)).rejects.toThrow(
        ForbiddenException,
      );

      expect(courseRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('findManageableAuthors', () => {
    it('returns the reviewed creator author library for admin', async () => {
      const course = createCourse({ ownerUserId: creatorUser.id });
      const authors = [
        createAuthor('550e8400-e29b-41d4-a716-446655440001', creatorUser.id),
      ];

      courseRepository.findOne.mockResolvedValue(course);
      authorRepository.find.mockResolvedValue(authors);

      const result = await service.findManageableAuthors(course.id, adminUser);

      expect(authorRepository.find).toHaveBeenCalledWith({
        where: {
          ownerUserId: creatorUser.id,
        },
        order: { updatedAt: 'DESC' },
      });
      expect(result).toEqual(authors);
    });
  });
});
