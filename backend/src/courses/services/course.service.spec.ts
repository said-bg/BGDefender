import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseService } from './course.service';
import {
  Course,
  CourseLevel,
  CourseStatus,
} from '../../entities/course.entity';
import { Author } from '../../entities/author.entity';

type MockCourseRepository = Pick<
  Repository<Course>,
  'findAndCount' | 'findOne' | 'create' | 'save' | 'remove'
> & {
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
};

type MockAuthorRepository = Pick<Repository<Author>, 'findByIds'> & {
  findByIds: jest.Mock;
};

const createCourse = (): Course =>
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
        subChapters: [],
      },
    ],
  }) as Course;

describe('CourseService', () => {
  let service: CourseService;
  let courseRepository: MockCourseRepository;
  let authorRepository: MockAuthorRepository;

  beforeEach(async () => {
    courseRepository = {
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
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
        relations: ['authors', 'chapters', 'chapters.subChapters'],
        take: 20,
        skip: 0,
        order: { createdAt: 'DESC' },
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
    });

    // Verifies the not-found case so the service throws the expected NestJS exception.
    it('throws NotFoundException when the course does not exist', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('missing-course')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
