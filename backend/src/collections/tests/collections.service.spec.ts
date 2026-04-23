import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseCollection } from '../../entities/course-collection.entity';
import { CourseCollectionItem } from '../../entities/course-collection-item.entity';
import {
  Course,
  CourseLevel,
  CourseStatus,
} from '../../entities/course.entity';
import { CreateCourseCollectionDto } from '../dto/create-course-collection.dto';
import { UpdateCourseCollectionDto } from '../dto/update-course-collection.dto';
import { CollectionsService } from '../services/collections.service';

type MockCollectionRepository = Pick<
  Repository<CourseCollection>,
  'find' | 'findOne' | 'create' | 'save' | 'remove'
> & {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
};

type MockCollectionItemRepository = Pick<
  Repository<CourseCollectionItem>,
  'create'
> & {
  create: jest.Mock;
};

type MockCourseRepository = Pick<Repository<Course>, 'findByIds'> & {
  findByIds: jest.Mock;
};

const createCourse = (overrides: Partial<Course> = {}): Course =>
  ({
    id: 'course-1',
    titleEn: 'Cloud Security',
    titleFi: 'Cloud Security',
    descriptionEn: 'desc',
    descriptionFi: 'desc',
    level: CourseLevel.FREE,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 60,
    coverImage: '/cover.jpg',
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
            descriptionFi: 'Alakuvaus 2',
            orderIndex: 2,
            chapterId: 'chapter-2',
            chapter: undefined,
            pedagogicalContents: [],
          },
          {
            id: 'sub-1',
            titleEn: 'Sub 1',
            titleFi: 'Alaluku 1',
            descriptionEn: 'Sub desc 1',
            descriptionFi: 'Alakuvaus 1',
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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }) as Course;

const createCollection = (
  overrides: Partial<CourseCollection> = {},
): CourseCollection =>
  ({
    id: 'collection-1',
    titleEn: 'Cyber basics',
    titleFi: 'Cyber basics',
    descriptionEn: null,
    descriptionFi: null,
    coverImage: null,
    orderIndex: 1,
    isPublished: true,
    items: [],
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-04T00:00:00.000Z'),
    ...overrides,
  }) as CourseCollection;

const createCollectionItem = (
  overrides: Partial<CourseCollectionItem> = {},
): CourseCollectionItem =>
  ({
    id: 'item-1',
    collectionId: 'collection-1',
    courseId: 'course-1',
    orderIndex: 1,
    collection: undefined,
    course: createCourse(),
    ...overrides,
  }) as CourseCollectionItem;

describe('CollectionsService', () => {
  let service: CollectionsService;
  let collectionRepository: MockCollectionRepository;
  let collectionItemRepository: MockCollectionItemRepository;
  let courseRepository: MockCourseRepository;

  beforeEach(async () => {
    collectionRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    collectionItemRepository = {
      create: jest.fn(),
    };

    courseRepository = {
      findByIds: jest.fn(),
    };

    collectionRepository.create.mockImplementation(
      (value: Partial<CourseCollection>) => value as CourseCollection,
    );
    collectionItemRepository.create.mockImplementation(
      (value: Partial<CourseCollectionItem>) => value as CourseCollectionItem,
    );
    collectionRepository.save.mockImplementation((value: CourseCollection) =>
      Promise.resolve(value),
    );
    collectionRepository.find.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        {
          provide: getRepositoryToken(CourseCollection),
          useValue: collectionRepository,
        },
        {
          provide: getRepositoryToken(CourseCollectionItem),
          useValue: collectionItemRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listAdminCollections', () => {
    it('returns admin collections with ordered items and sorted course trees', async () => {
      const secondCourse = createCourse({
        id: 'course-2',
        titleEn: 'Network Security',
      });

      collectionRepository.find.mockResolvedValue([
        createCollection({
          items: [
            createCollectionItem({
              orderIndex: 2,
              courseId: 'course-2',
              course: secondCourse,
            }),
            createCollectionItem({
              orderIndex: 1,
              courseId: 'course-1',
              course: createCourse(),
            }),
          ],
        }),
      ]);

      const result = await service.listAdminCollections();

      expect(collectionRepository.find).toHaveBeenCalledWith({
        relations: [
          'items',
          'items.course',
          'items.course.authors',
          'items.course.finalTests',
          'items.course.chapters',
          'items.course.chapters.trainingQuiz',
          'items.course.chapters.subChapters',
        ],
        order: {
          orderIndex: 'ASC',
          createdAt: 'ASC',
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].courses.map((course) => course.id)).toEqual([
        'course-1',
        'course-2',
      ]);
      expect(
        result[0].courses[0].chapters.map((chapter) => chapter.id),
      ).toEqual(['chapter-1', 'chapter-2']);
      expect(
        result[0].courses[0].chapters[1].subChapters.map(
          (subChapter) => subChapter.id,
        ),
      ).toEqual(['sub-1', 'sub-2']);
    });
  });

  describe('listPublishedCollections', () => {
    it('returns only published collections and filters out draft courses', async () => {
      collectionRepository.find.mockResolvedValue([
        createCollection({
          items: [
            createCollectionItem({
              orderIndex: 1,
              course: createCourse({ id: 'course-1' }),
            }),
            createCollectionItem({
              orderIndex: 2,
              courseId: 'course-2',
              course: createCourse({
                id: 'course-2',
                status: CourseStatus.DRAFT,
              }),
            }),
          ],
        }),
      ]);

      const result = await service.listPublishedCollections();

      expect(collectionRepository.find).toHaveBeenCalledWith({
        where: { isPublished: true },
        relations: [
          'items',
          'items.course',
          'items.course.authors',
          'items.course.finalTests',
          'items.course.chapters',
          'items.course.chapters.trainingQuiz',
          'items.course.chapters.subChapters',
        ],
        order: {
          orderIndex: 'ASC',
          createdAt: 'ASC',
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].courses).toHaveLength(1);
      expect(result[0].courses[0].id).toBe('course-1');
    });

    it('removes published collections that end up empty after filtering draft courses', async () => {
      collectionRepository.find.mockResolvedValue([
        createCollection({
          items: [
            createCollectionItem({
              course: createCourse({
                id: 'course-2',
                status: CourseStatus.DRAFT,
              }),
            }),
          ],
        }),
      ]);

      const result = await service.listPublishedCollections();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates a collection with trimmed fields and ordered items', async () => {
      const dto: CreateCourseCollectionDto = {
        titleEn: '  Cyber basics  ',
        titleFi: '  Cyber basics  ',
        descriptionEn: '  EN description  ',
        descriptionFi: '  FI description  ',
        coverImage: '  /cover.jpg  ',
        orderIndex: 3,
        isPublished: false,
        courseIds: ['course-1', 'course-2'],
      };
      const courses = [
        createCourse({ id: 'course-1' }),
        createCourse({ id: 'course-2', titleEn: 'Network Security' }),
      ];
      collectionRepository.find.mockResolvedValue([
        createCollection({ id: 'collection-existing-1', orderIndex: 1 }),
        createCollection({ id: 'collection-existing-2', orderIndex: 2 }),
      ]);

      courseRepository.findByIds.mockResolvedValue(courses);
      collectionRepository.findOne.mockResolvedValue(
        createCollection({
          id: 'collection-1',
          titleEn: 'Cyber basics',
          titleFi: 'Cyber basics',
          descriptionEn: 'EN description',
          descriptionFi: 'FI description',
          coverImage: '/cover.jpg',
          orderIndex: 3,
          isPublished: false,
          items: [
            createCollectionItem({
              orderIndex: 1,
              courseId: 'course-1',
              course: courses[0],
            }),
            createCollectionItem({
              id: 'item-2',
              orderIndex: 2,
              courseId: 'course-2',
              course: courses[1],
            }),
          ],
        }),
      );

      const result = await service.create(dto);

      // Item ordering is part of the collection contract because it controls the learner-facing order.
      expect(collectionItemRepository.create).toHaveBeenNthCalledWith(1, {
        courseId: 'course-1',
        orderIndex: 1,
        course: courses[0],
      });
      expect(collectionItemRepository.create).toHaveBeenNthCalledWith(2, {
        courseId: 'course-2',
        orderIndex: 2,
        course: courses[1],
      });
      expect(collectionRepository.create).toHaveBeenCalledWith({
        titleEn: 'Cyber basics',
        titleFi: 'Cyber basics',
        descriptionEn: 'EN description',
        descriptionFi: 'FI description',
        coverImage: '/cover.jpg',
        orderIndex: 3,
        isPublished: false,
        items: [
          expect.objectContaining({ courseId: 'course-1', orderIndex: 1 }),
          expect.objectContaining({ courseId: 'course-2', orderIndex: 2 }),
        ],
      });
      expect(result.titleEn).toBe('Cyber basics');
      expect(result.coverImage).toBe('/cover.jpg');
      expect(result.courses.map((course) => course.id)).toEqual([
        'course-1',
        'course-2',
      ]);
    });

    it('creates an empty published collection when no course ids are provided', async () => {
      collectionRepository.findOne.mockResolvedValue(
        createCollection({
          items: [],
        }),
      );

      const result = await service.create({
        titleEn: 'No courses yet',
        titleFi: 'No courses yet',
      });

      expect(courseRepository.findByIds).not.toHaveBeenCalled();
      expect(collectionRepository.create).toHaveBeenCalledWith({
        titleEn: 'No courses yet',
        titleFi: 'No courses yet',
        descriptionEn: null,
        descriptionFi: null,
        coverImage: null,
        orderIndex: 1,
        isPublished: true,
        items: [],
      });
      expect(result.courses).toEqual([]);
    });

    it('appends a collection after existing siblings when no order is provided', async () => {
      collectionRepository.find.mockResolvedValue([
        createCollection({ id: 'collection-existing-1', orderIndex: 1 }),
        createCollection({ id: 'collection-existing-2', orderIndex: 2 }),
      ]);
      collectionRepository.findOne.mockResolvedValue(
        createCollection({
          id: 'collection-new',
          titleEn: 'Appended',
          titleFi: 'Appended',
          orderIndex: 3,
          items: [],
        }),
      );

      const result = await service.create({
        titleEn: 'Appended',
        titleFi: 'Appended',
      });

      expect(collectionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ orderIndex: 3 }),
      );
      expect(result.orderIndex).toBe(3);
    });

    it('throws when one or more collection course ids cannot be resolved', async () => {
      courseRepository.findByIds.mockResolvedValue([
        createCourse({ id: 'course-1' }),
      ]);

      await expect(
        service.create({
          titleEn: 'Cyber basics',
          titleFi: 'Cyber basics',
          courseIds: ['course-1', 'course-2'],
        }),
      ).rejects.toThrow(NotFoundException);

      expect(collectionRepository.create).not.toHaveBeenCalled();
      expect(collectionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates fields, trims text and rebuilds items when course ids are provided', async () => {
      const existingCollection = createCollection({
        items: [
          createCollectionItem({
            collectionId: 'collection-1',
            courseId: 'course-1',
            course: createCourse({ id: 'course-1' }),
          }),
        ],
      });
      const updatedCourses = [
        createCourse({ id: 'course-2', titleEn: 'Network Security' }),
        createCourse({ id: 'course-3', titleEn: 'Incident Response' }),
      ];
      const dto: UpdateCourseCollectionDto = {
        titleEn: '  Updated title  ',
        descriptionEn: '  Updated description  ',
        coverImage: '  /updated-cover.jpg  ',
        orderIndex: 5,
        isPublished: false,
        courseIds: ['course-2', 'course-3'],
      };
      collectionRepository.find.mockResolvedValue([
        createCollection({ id: 'collection-1', orderIndex: 1 }),
        createCollection({ id: 'collection-2', orderIndex: 2 }),
        createCollection({ id: 'collection-3', orderIndex: 3 }),
        createCollection({ id: 'collection-4', orderIndex: 4 }),
        createCollection({ id: 'collection-5', orderIndex: 5 }),
      ]);

      collectionRepository.findOne
        .mockResolvedValueOnce(existingCollection)
        .mockResolvedValueOnce(
          createCollection({
            id: 'collection-1',
            titleEn: 'Updated title',
            titleFi: existingCollection.titleFi,
            descriptionEn: 'Updated description',
            descriptionFi: existingCollection.descriptionFi,
            coverImage: '/updated-cover.jpg',
            orderIndex: 5,
            isPublished: false,
            items: [
              createCollectionItem({
                id: 'item-2',
                collectionId: 'collection-1',
                courseId: 'course-2',
                orderIndex: 1,
                course: updatedCourses[0],
              }),
              createCollectionItem({
                id: 'item-3',
                collectionId: 'collection-1',
                courseId: 'course-3',
                orderIndex: 2,
                course: updatedCourses[1],
              }),
            ],
          }),
        );
      courseRepository.findByIds.mockResolvedValue(updatedCourses);

      const result = await service.update('collection-1', dto);

      expect(collectionItemRepository.create).toHaveBeenNthCalledWith(1, {
        collectionId: 'collection-1',
        courseId: 'course-2',
        orderIndex: 1,
        course: updatedCourses[0],
      });
      expect(collectionItemRepository.create).toHaveBeenNthCalledWith(2, {
        collectionId: 'collection-1',
        courseId: 'course-3',
        orderIndex: 2,
        course: updatedCourses[1],
      });
      expect(collectionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'collection-1',
          titleEn: 'Updated title',
          descriptionEn: 'Updated description',
          coverImage: '/updated-cover.jpg',
          orderIndex: 5,
          isPublished: false,
        }),
      );
      expect(result.courses.map((course) => course.id)).toEqual([
        'course-2',
        'course-3',
      ]);
    });

    it('updates scalar fields without rebuilding items when courseIds is omitted', async () => {
      const existingItems = [
        createCollectionItem({
          collectionId: 'collection-1',
          courseId: 'course-1',
          course: createCourse({ id: 'course-1' }),
        }),
      ];
      const existingCollection = createCollection({
        id: 'collection-1',
        items: existingItems,
      });

      collectionRepository.findOne
        .mockResolvedValueOnce(existingCollection)
        .mockResolvedValueOnce(
          createCollection({
            id: 'collection-1',
            titleEn: 'Updated title',
            items: existingItems,
          }),
        );

      const result = await service.update('collection-1', {
        titleEn: '  Updated title  ',
      });

      // Omitting courseIds should preserve the current item list instead of rebuilding it.
      expect(collectionItemRepository.create).not.toHaveBeenCalled();
      expect(courseRepository.findByIds).not.toHaveBeenCalled();
      expect(collectionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'collection-1',
          titleEn: 'Updated title',
          items: existingItems,
        }),
      );
      expect(result.titleEn).toBe('Updated title');
      expect(result.courses.map((course) => course.id)).toEqual(['course-1']);
    });

    it('clears nullable fields when update receives empty strings', async () => {
      const existingCollection = createCollection({
        descriptionEn: 'Old description',
        coverImage: '/old-cover.jpg',
      });

      collectionRepository.findOne
        .mockResolvedValueOnce(existingCollection)
        .mockResolvedValueOnce(
          createCollection({
            descriptionEn: null,
            coverImage: null,
          }),
        );

      const result = await service.update('collection-1', {
        descriptionEn: '   ',
        coverImage: '   ',
      });

      expect(collectionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          descriptionEn: null,
          coverImage: null,
        }),
      );
      expect(result.descriptionEn).toBeNull();
      expect(result.coverImage).toBeNull();
    });

    it('throws when updating a missing collection', async () => {
      collectionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing', { titleEn: 'Updated title' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when update course ids cannot all be resolved', async () => {
      collectionRepository.findOne.mockResolvedValue(
        createCollection({
          id: 'collection-1',
        }),
      );
      courseRepository.findByIds.mockResolvedValue([
        createCourse({ id: 'course-2' }),
      ]);

      await expect(
        service.update('collection-1', {
          courseIds: ['course-2', 'course-3'],
        }),
      ).rejects.toThrow(NotFoundException);

      expect(collectionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('removes an existing collection after loading it first', async () => {
      const collection = createCollection({
        id: 'collection-1',
      });
      collectionRepository.findOne.mockResolvedValue(collection);
      collectionRepository.remove.mockResolvedValue(collection);

      await service.delete('collection-1');

      expect(collectionRepository.remove).toHaveBeenCalledWith(collection);
    });

    it('closes order gaps after deleting a collection', async () => {
      const firstCollection = createCollection({
        id: 'collection-1',
        orderIndex: 1,
      });
      const secondCollection = createCollection({
        id: 'collection-2',
        orderIndex: 2,
      });
      const thirdCollection = createCollection({
        id: 'collection-3',
        orderIndex: 3,
      });

      collectionRepository.findOne.mockResolvedValue(secondCollection);
      collectionRepository.find.mockResolvedValue([
        firstCollection,
        secondCollection,
        thirdCollection,
      ]);
      collectionRepository.remove.mockResolvedValue(secondCollection);

      await service.delete('collection-2');

      expect(thirdCollection.orderIndex).toBe(2);
      expect(collectionRepository.save).toHaveBeenCalledWith([thirdCollection]);
    });

    it('throws when deleting a missing collection', async () => {
      collectionRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
