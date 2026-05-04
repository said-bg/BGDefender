import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from '../../entities/author.entity';
import {
  Course,
  CourseLevel,
  CourseStatus,
} from '../../entities/course.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CourseService } from './course.service';

type MockCourseRepository = Pick<
  Repository<Course>,
  'count' | 'findAndCount' | 'findOne' | 'create' | 'save' | 'remove'
> & {
  count: jest.Mock;
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
};

type MockAuthorRepository = Pick<Repository<Author>, 'findByIds'> & {
  findByIds: jest.Mock;
};

const createAuthor = (
  id: string = '550e8400-e29b-41d4-a716-446655440001',
): Author =>
  ({
    id,
    name: 'Said Ait Baha',
    roleEn: 'Cybersecurity Trainer',
    roleFi: 'Kyberturvallisuuden kouluttaja',
    biographyEn: 'Hands-on offensive security specialist.',
    biographyFi: 'Kaytannonlaheinen tietoturvan asiantuntija.',
    photo: '/uploads/authors/said.jpg',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  }) as Author;

const createCourse = (overrides: Partial<Course> = {}): Course =>
  ({
    id: 'course-1',
    titleEn: 'Course EN',
    titleFi: 'Course FI',
    descriptionEn: 'Description EN',
    descriptionFi: 'Description FI',
    level: CourseLevel.FREE,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 60,
    coverImage: '/cover.jpg',
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
  const notificationsService = {
    notifyCoursePublished: jest.fn(),
    deleteCourseNotifications: jest.fn(),
  };

  beforeEach(async () => {
    courseRepository = {
      count: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    authorRepository = {
      findByIds: jest.fn(),
    };

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

      const result = await service.create(dto);

      // Only course fields should be sent to create because author ids are resolved separately.
      expect(courseRepository.create).toHaveBeenCalledWith({
        titleEn: dto.titleEn,
        titleFi: dto.titleFi,
        descriptionEn: dto.descriptionEn,
        descriptionFi: dto.descriptionFi,
        level: dto.level,
        status: dto.status,
        estimatedDuration: dto.estimatedDuration,
        coverImage: dto.coverImage,
      });
      expect(authorRepository.findByIds).not.toHaveBeenCalled();
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
        createAuthor('550e8400-e29b-41d4-a716-446655440001'),
        createAuthor('550e8400-e29b-41d4-a716-446655440002'),
      ];
      const createdCourse = createCourse({
        status: CourseStatus.PUBLISHED,
        authors,
      });

      courseRepository.create.mockReturnValue(createdCourse);
      authorRepository.findByIds.mockResolvedValue(authors);
      courseRepository.save.mockResolvedValue(createdCourse);

      const result = await service.create(dto);

      expect(authorRepository.findByIds).toHaveBeenCalledWith(dto.authorIds);
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
      authorRepository.findByIds.mockResolvedValue([
        createAuthor('550e8400-e29b-41d4-a716-446655440001'),
      ]);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);

      expect(courseRepository.save).not.toHaveBeenCalled();
      expect(notificationsService.notifyCoursePublished).not.toHaveBeenCalled();
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

      const [courses, count] = await service.findAllForAdmin();

      expect(count).toBe(1);
      expect(courses[0].chapters.map((chapter) => chapter.id)).toEqual([
        'chapter-1',
        'chapter-2',
      ]);
      expect(courseRepository.findAndCount).toHaveBeenCalledWith({
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
  });

  describe('getAdminSummary', () => {
    it('returns separate totals for published, draft and archived courses', async () => {
      courseRepository.count
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(3);

      const result = await service.getAdminSummary();

      expect(courseRepository.count).toHaveBeenNthCalledWith(1);
      expect(courseRepository.count).toHaveBeenNthCalledWith(2, {
        where: { status: CourseStatus.PUBLISHED },
      });
      expect(courseRepository.count).toHaveBeenNthCalledWith(3, {
        where: { status: CourseStatus.DRAFT },
      });
      expect(courseRepository.count).toHaveBeenNthCalledWith(4, {
        where: { status: CourseStatus.ARCHIVED },
      });
      expect(result).toEqual({
        totalCourses: 12,
        publishedCourses: 5,
        draftCourses: 4,
        archivedCourses: 3,
      });
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
        where: { id: 'course-1', status: CourseStatus.PUBLISHED },
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

  describe('update', () => {
    it('publishes a previously draft course and notifies subscribers', async () => {
      const existingCourse = createCourse({ status: CourseStatus.DRAFT });
      const savedCourse = createCourse({
        status: CourseStatus.PUBLISHED,
        titleEn: 'Updated Course EN',
      });
      const dto: UpdateCourseDto = {
        titleEn: 'Updated Course EN',
        status: CourseStatus.PUBLISHED,
      };

      courseRepository.findOne.mockResolvedValue(existingCourse);
      courseRepository.save.mockResolvedValue(savedCourse);

      const result = await service.update(existingCourse.id, dto);

      expect(courseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: existingCourse.id,
          titleEn: 'Updated Course EN',
          status: CourseStatus.PUBLISHED,
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

      const result = await service.update(existingCourse.id, { authorIds: [] });

      expect(authorRepository.findByIds).not.toHaveBeenCalled();
      expect(courseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: existingCourse.id,
          authors: [],
        }),
      );
      expect(result.authors).toEqual([]);
    });

    it('removes notifications when a published course becomes unpublished', async () => {
      const existingCourse = createCourse({ status: CourseStatus.PUBLISHED });
      const savedCourse = createCourse({ status: CourseStatus.ARCHIVED });

      courseRepository.findOne.mockResolvedValue(existingCourse);
      courseRepository.save.mockResolvedValue(savedCourse);

      const result = await service.update(existingCourse.id, {
        status: CourseStatus.ARCHIVED,
      });

      expect(
        notificationsService.deleteCourseNotifications,
      ).toHaveBeenCalledWith(savedCourse.id);
      expect(notificationsService.notifyCoursePublished).not.toHaveBeenCalled();
      expect(result).toEqual(savedCourse);
    });

    it('throws when update receives author ids that cannot all be resolved', async () => {
      const existingCourse = createCourse({ status: CourseStatus.DRAFT });

      courseRepository.findOne.mockResolvedValue(existingCourse);
      authorRepository.findByIds.mockResolvedValue([createAuthor()]);

      await expect(
        service.update(existingCourse.id, {
          authorIds: [
            '550e8400-e29b-41d4-a716-446655440001',
            '550e8400-e29b-41d4-a716-446655440002',
          ],
        }),
      ).rejects.toThrow(NotFoundException);

      expect(courseRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('removes the course and deletes related notifications', async () => {
      const course = createCourse();

      courseRepository.findOne.mockResolvedValue(course);
      courseRepository.remove.mockResolvedValue(course);

      await service.delete(course.id);

      expect(courseRepository.remove).toHaveBeenCalledWith(course);
      expect(
        notificationsService.deleteCourseNotifications,
      ).toHaveBeenCalledWith(course.id);
    });
  });
});
