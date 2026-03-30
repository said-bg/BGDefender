import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Favorite } from '../../entities/favorite.entity';
import {
  Course,
  CourseLevel,
  CourseStatus,
} from '../../entities/course.entity';
import { FavoriteService } from './favorite.service';

type FindFn<T extends object> = (options?: unknown) => Promise<T[]>;
type FindOneFn<T extends object> = (options?: unknown) => Promise<T | null>;
type CreateFn<T extends object> = (entityLike?: Partial<T>) => T;
type SaveFn<T extends object> = (entity: T) => Promise<T>;
type RemoveFn<T extends object> = (entity: T) => Promise<T>;

type MockRepository<T extends object> = {
  find: jest.MockedFunction<FindFn<T>>;
  findOne: jest.MockedFunction<FindOneFn<T>>;
  create: jest.MockedFunction<CreateFn<T>>;
  save: jest.MockedFunction<SaveFn<T>>;
  remove: jest.MockedFunction<RemoveFn<T>>;
};

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  find: jest.fn<FindFn<T>>(),
  findOne: jest.fn<FindOneFn<T>>(),
  create: jest.fn<CreateFn<T>>(),
  save: jest.fn<SaveFn<T>>(),
  remove: jest.fn<RemoveFn<T>>(),
});

const createCourse = (): Course =>
  Object.assign(new Course(), {
    id: 'course-1',
    titleEn: 'Course EN',
    titleFi: 'Course FI',
    descriptionEn: 'Description EN',
    descriptionFi: 'Description FI',
    level: CourseLevel.FREE,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 60,
    coverImage: '/cover.jpg',
    authors: [],
    chapters: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

const createFavorite = (): Favorite =>
  Object.assign(new Favorite(), {
    id: 'favorite-1',
    userId: 12,
    courseId: 'course-1',
    course: createCourse(),
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
  });

describe('FavoriteService', () => {
  let service: FavoriteService;
  let favoriteRepository: MockRepository<Favorite>;
  let courseRepository: MockRepository<Course>;

  beforeEach(async () => {
    // Builds strongly typed repository doubles so Jest mocks stay readable and safe in TypeScript.
    favoriteRepository = createMockRepository<Favorite>();
    courseRepository = createMockRepository<Course>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteService,
        {
          provide: getRepositoryToken(Favorite),
          useValue: favoriteRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
      ],
    }).compile();

    service = module.get<FavoriteService>(FavoriteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForUser', () => {
    // Verifies that the favorites page can request the current user's favorites with linked course data.
    it('loads favorites with the related course ordered by newest first', async () => {
      favoriteRepository.find.mockResolvedValue([createFavorite()]);

      const result = await service.findAllForUser(12);

      expect(result).toHaveLength(1);
      expect(favoriteRepository.find).toHaveBeenCalledWith({
        where: { userId: 12 },
        relations: ['course'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('addForUserAndCourse', () => {
    // Verifies that adding a favorite is idempotent when the course is already starred.
    it('returns the existing favorite when the course is already favorited', async () => {
      const favorite = createFavorite();
      favoriteRepository.findOne.mockResolvedValue(favorite);

      const result = await service.addForUserAndCourse(12, 'course-1');

      expect(result).toBe(favorite);
      expect(courseRepository.findOne).not.toHaveBeenCalled();
    });

    // Verifies that a valid course creates a new favorite row tied to the authenticated user.
    it('creates a new favorite when the course exists and is not already favorited', async () => {
      const favorite = createFavorite();

      favoriteRepository.findOne.mockResolvedValueOnce(null);
      courseRepository.findOne.mockResolvedValue(createCourse());
      favoriteRepository.create.mockReturnValue(favorite);
      favoriteRepository.save.mockImplementation((value: Favorite) =>
        Promise.resolve(value),
      );

      const result = await service.addForUserAndCourse(12, 'course-1');

      expect(favoriteRepository.create).toHaveBeenCalledTimes(1);
      const createCall = favoriteRepository.create.mock.calls[0]?.[0];
      expect(createCall).toMatchObject({
        userId: 12,
        courseId: 'course-1',
      });
      expect(createCall?.course).toBeDefined();
      expect(createCall?.course.id).toBe('course-1');
      expect(result.courseId).toBe('course-1');
    });

    // Verifies that starring a missing course returns the expected NestJS not-found error.
    it('throws when the target course does not exist', async () => {
      favoriteRepository.findOne.mockResolvedValue(null);
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addForUserAndCourse(12, 'missing-course'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteByUserAndCourse', () => {
    // Verifies the delete flow stays safe when the course was never favorited.
    it('does nothing when there is no favorite to delete', async () => {
      favoriteRepository.findOne.mockResolvedValue(null);

      await service.deleteByUserAndCourse(12, 'course-1');

      expect(favoriteRepository.remove).not.toHaveBeenCalled();
    });
  });
});
