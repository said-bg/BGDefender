import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Progress, ProgressViewType } from '../../entities/progress.entity';
import {
  Course,
  CourseLevel,
  CourseStatus,
} from '../../entities/course.entity';
import { Chapter } from '../../entities/chapter.entity';
import { SubChapter } from '../../entities/sub-chapter.entity';
import { ProgressService } from './progress.service';

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

const createProgress = (): Progress =>
  Object.assign(new Progress(), {
    id: 'progress-1',
    userId: 12,
    courseId: 'course-1',
    completionPercentage: 30,
    completed: false,
    completedAt: null,
    lastAccessedAt: new Date('2026-01-02T00:00:00.000Z'),
    lastViewedType: ProgressViewType.CHAPTER,
    lastChapterId: 'chapter-1',
    lastSubChapterId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });

const createChapterRef = (): Chapter =>
  Object.assign(new Chapter(), {
    id: 'chapter-1',
    courseId: 'course-1',
  });

const createSubChapterRef = (): SubChapter =>
  Object.assign(new SubChapter(), {
    id: 'sub-1',
    chapterId: 'chapter-1',
  });

describe('ProgressService', () => {
  let service: ProgressService;
  let progressRepository: MockRepository<Progress>;
  let courseRepository: MockRepository<Course>;
  let chapterRepository: MockRepository<Chapter>;
  let subChapterRepository: MockRepository<SubChapter>;

  beforeEach(async () => {
    // Builds strongly typed repository doubles so Jest mocks do not degrade into "any" in the editor.
    progressRepository = createMockRepository<Progress>();
    courseRepository = createMockRepository<Course>();
    chapterRepository = createMockRepository<Chapter>();
    subChapterRepository = createMockRepository<SubChapter>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: getRepositoryToken(Progress),
          useValue: progressRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
        {
          provide: getRepositoryToken(Chapter),
          useValue: chapterRepository,
        },
        {
          provide: getRepositoryToken(SubChapter),
          useValue: subChapterRepository,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForUser', () => {
    // Verifies that the dashboard/home page can request the current user's progresses already sorted by recent access.
    it('requests progresses with course relation and descending lastAccessedAt order', async () => {
      progressRepository.find.mockResolvedValue([createProgress()]);

      const result = await service.findAllForUser(12);

      expect(result).toHaveLength(1);
      expect(progressRepository.find).toHaveBeenCalledWith({
        where: { userId: 12 },
        relations: ['course'],
        order: { lastAccessedAt: 'DESC' },
      });
    });
  });

  describe('upsertForUserAndCourse', () => {
    // Verifies that the first visit creates a progress row and clears chapter data when the current view is overview.
    it('creates a new progress entry and normalizes overview state', async () => {
      const newProgress = createProgress();
      newProgress.lastViewedType = null;
      newProgress.lastChapterId = 'chapter-1';
      newProgress.lastSubChapterId = 'sub-1';

      courseRepository.findOne.mockResolvedValue(createCourse());
      progressRepository.findOne.mockResolvedValue(null);
      progressRepository.create.mockReturnValue(newProgress);
      progressRepository.save.mockImplementation((value: Progress) =>
        Promise.resolve(value),
      );

      const result = await service.upsertForUserAndCourse(12, 'course-1', {
        completionPercentage: 10,
        lastViewedType: ProgressViewType.OVERVIEW,
      });

      expect(progressRepository.create).toHaveBeenCalledWith({
        userId: 12,
        courseId: 'course-1',
        completionPercentage: 0,
        completed: false,
        completedAt: null,
        lastViewedType: null,
        lastChapterId: null,
        lastSubChapterId: null,
      });
      expect(result.lastViewedType).toBe(ProgressViewType.OVERVIEW);
      expect(result.lastChapterId).toBeNull();
      expect(result.lastSubChapterId).toBeNull();
      expect(result.completed).toBe(false);
    });

    // Verifies that reaching 100% marks the course as completed and stores the last subchapter resume point.
    it('updates an existing progress entry and marks it as completed at 100%', async () => {
      const existingProgress = createProgress();

      courseRepository.findOne.mockResolvedValue(createCourse());
      chapterRepository.findOne.mockResolvedValue(createChapterRef());
      subChapterRepository.findOne.mockResolvedValue(createSubChapterRef());
      progressRepository.findOne.mockResolvedValue(existingProgress);
      progressRepository.save.mockImplementation((value: Progress) =>
        Promise.resolve(value),
      );

      const result = await service.upsertForUserAndCourse(12, 'course-1', {
        completionPercentage: 100,
        lastViewedType: ProgressViewType.SUBCHAPTER,
        lastChapterId: 'chapter-1',
        lastSubChapterId: 'sub-1',
      });

      expect(result.completed).toBe(true);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.lastViewedType).toBe(ProgressViewType.SUBCHAPTER);
      expect(result.lastSubChapterId).toBe('sub-1');
    });

    // Verifies that chapter mode cannot be saved without the chapter identifier needed for resume.
    it('throws when chapter progress is saved without a chapter id', async () => {
      courseRepository.findOne.mockResolvedValue(createCourse());

      await expect(
        service.upsertForUserAndCourse(12, 'course-1', {
          completionPercentage: 25,
          lastViewedType: ProgressViewType.CHAPTER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    // Verifies that the resume target is rejected when the chapter does not belong to the selected course.
    it('throws when chapter does not belong to the course', async () => {
      courseRepository.findOne.mockResolvedValue(createCourse());
      chapterRepository.findOne.mockResolvedValue(null);

      await expect(
        service.upsertForUserAndCourse(12, 'course-1', {
          completionPercentage: 25,
          lastViewedType: ProgressViewType.CHAPTER,
          lastChapterId: 'missing-chapter',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    // Verifies that the resume target is rejected when the subchapter does not belong to the selected chapter.
    it('throws when subchapter does not belong to the chapter', async () => {
      courseRepository.findOne.mockResolvedValue(createCourse());
      chapterRepository.findOne.mockResolvedValue(createChapterRef());
      subChapterRepository.findOne.mockResolvedValue(null);

      await expect(
        service.upsertForUserAndCourse(12, 'course-1', {
          completionPercentage: 25,
          lastViewedType: ProgressViewType.SUBCHAPTER,
          lastChapterId: 'chapter-1',
          lastSubChapterId: 'missing-subchapter',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteByUserAndCourse', () => {
    // Verifies the delete flow stays safe when no progress exists yet for the course.
    it('does nothing when there is no progress to delete', async () => {
      progressRepository.findOne.mockResolvedValue(null);

      await service.deleteByUserAndCourse(12, 'course-1');

      expect(progressRepository.remove).not.toHaveBeenCalled();
    });
  });
});
