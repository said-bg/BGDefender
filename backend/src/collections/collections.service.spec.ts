import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourseCollection } from '../entities/course-collection.entity';
import { CourseCollectionItem } from '../entities/course-collection-item.entity';
import { Course, CourseLevel, CourseStatus } from '../entities/course.entity';
import { CollectionsService } from './collections.service';

describe('CollectionsService', () => {
  let service: CollectionsService;

  const collectionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const collectionItemRepository = {
    create: jest.fn(),
  };

  const courseRepository = {
    findByIds: jest.fn(),
  };

  const publishedCourse = {
    id: 'course-1',
    titleEn: 'Cloud Security',
    titleFi: 'Cloud Security',
    descriptionEn: 'desc',
    descriptionFi: 'desc',
    level: CourseLevel.FREE,
    status: CourseStatus.PUBLISHED,
    authors: [],
    finalTests: [],
    chapters: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Course;

  beforeEach(async () => {
    jest.clearAllMocks();
    collectionRepository.create.mockImplementation(
      (value: Partial<CourseCollection>) => value as CourseCollection,
    );
    collectionItemRepository.create.mockImplementation(
      (value: Partial<CourseCollectionItem>) => value as CourseCollectionItem,
    );
    collectionRepository.save.mockImplementation((value: CourseCollection) =>
      Promise.resolve(value),
    );

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

  it('creates a collection with ordered items', async () => {
    courseRepository.findByIds.mockResolvedValue([publishedCourse]);
    collectionRepository.findOne.mockResolvedValue({
      id: 'collection-1',
      titleEn: 'Cyber basics',
      titleFi: 'Cyber basics',
      descriptionEn: null,
      descriptionFi: null,
      coverImage: null,
      orderIndex: 1,
      isPublished: true,
      items: [
        {
          orderIndex: 1,
          course: publishedCourse,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      titleEn: 'Cyber basics',
      titleFi: 'Cyber basics',
      courseIds: ['course-1'],
    });

    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].id).toBe('course-1');
  });

  it('returns only published courses for learner collections', async () => {
    collectionRepository.find.mockResolvedValue([
      {
        id: 'collection-1',
        titleEn: 'Featured',
        titleFi: 'Featured',
        descriptionEn: null,
        descriptionFi: null,
        coverImage: 'https://example.com/collection-cover.jpg',
        orderIndex: 1,
        isPublished: true,
        items: [
          {
            orderIndex: 1,
            course: publishedCourse,
          },
          {
            orderIndex: 2,
            course: {
              ...publishedCourse,
              id: 'course-2',
              status: CourseStatus.DRAFT,
            },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.listPublishedCollections();

    expect(result).toHaveLength(1);
    expect(result[0].courses).toHaveLength(1);
    expect(result[0].courses[0].id).toBe('course-1');
    expect(result[0].coverImage).toBe(
      'https://example.com/collection-cover.jpg',
    );
  });

  it('throws when updating a missing collection', async () => {
    collectionRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update('missing', { titleEn: 'Updated title' }),
    ).rejects.toThrow(NotFoundException);
  });
});
