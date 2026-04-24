import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';
import {
  Course,
  CourseLevel,
  CourseStatus,
} from '../../entities/course.entity';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';
import { ChapterService } from './chapters.service';

type MockChapterRepository = Pick<
  Repository<Chapter>,
  'create' | 'save' | 'find' | 'findAndCount' | 'findOne' | 'remove'
> & {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  remove: jest.Mock;
};

type MockCourseRepository = Pick<Repository<Course>, 'findOne'> & {
  findOne: jest.Mock;
};

const createCourseEntity = (): Course =>
  ({
    id: 'course-1',
    titleEn: 'Network Defense',
    titleFi: 'Verkon puolustus',
    descriptionEn: 'Learn the fundamentals of network defense.',
    descriptionFi: 'Opiskele verkon puolustuksen perusteet.',
    level: CourseLevel.FREE,
    status: CourseStatus.PUBLISHED,
    estimatedDuration: 90,
    coverImage: '/uploads/courses/network-defense.jpg',
    authors: [],
    chapters: [],
    finalTests: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  }) as Course;

const createChapterEntity = (): Chapter =>
  ({
    id: 'chapter-1',
    titleEn: 'Introduction',
    titleFi: 'Johdanto',
    descriptionEn: 'Start with the key concepts.',
    descriptionFi: 'Aloita keskeisista kasitteista.',
    orderIndex: 1,
    courseId: 'course-1',
    course: createCourseEntity(),
    subChapters: [],
    trainingQuiz: null,
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-04T00:00:00.000Z'),
  }) as Chapter;

describe('ChapterService', () => {
  let service: ChapterService;
  let chapterRepository: MockChapterRepository;
  let courseRepository: MockCourseRepository;

  beforeEach(async () => {
    chapterRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    courseRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChapterService,
        {
          provide: getRepositoryToken(Chapter),
          useValue: chapterRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
      ],
    }).compile();

    service = module.get<ChapterService>(ChapterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a chapter for an existing course', async () => {
    const dto: CreateChapterDto = {
      titleEn: 'Introduction',
      titleFi: 'Johdanto',
      descriptionEn: 'Start with the key concepts.',
      descriptionFi: 'Aloita keskeisista kasitteista.',
      orderIndex: 1,
    };
    const course = createCourseEntity();
    const createdChapter = createChapterEntity();

    courseRepository.findOne.mockResolvedValue(course);
    chapterRepository.find.mockResolvedValue([]);
    chapterRepository.create.mockReturnValue(createdChapter);
    chapterRepository.save.mockResolvedValue(createdChapter);

    const result = await service.create(course.id, dto);

    // The service must attach the parent course id before persisting the chapter.
    expect(chapterRepository.create).toHaveBeenCalledWith({
      ...dto,
      courseId: course.id,
    });
    expect(chapterRepository.save).toHaveBeenCalledWith(createdChapter);
    expect(result).toEqual(createdChapter);
  });

  it('throws NotFoundException when creating a chapter for a missing course', async () => {
    courseRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create('missing-course', {
        titleEn: 'Introduction',
        titleFi: 'Johdanto',
        descriptionEn: 'Start with the key concepts.',
        descriptionFi: 'Aloita keskeisista kasitteista.',
        orderIndex: 1,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(chapterRepository.create).not.toHaveBeenCalled();
    expect(chapterRepository.save).not.toHaveBeenCalled();
  });

  it('lists chapters for a course with pagination and ascending order', async () => {
    const chapters = [createChapterEntity()];
    chapterRepository.findAndCount.mockResolvedValue([chapters, 1]);

    const result = await service.findAll('course-1', 25, 5);

    expect(chapterRepository.findAndCount).toHaveBeenCalledWith({
      where: { courseId: 'course-1' },
      take: 25,
      skip: 5,
      order: { orderIndex: 'ASC' },
    });
    expect(result).toEqual([chapters, 1]);
  });

  it('uses default pagination values when none are provided', async () => {
    const chapters = [createChapterEntity()];
    chapterRepository.findAndCount.mockResolvedValue([chapters, 1]);

    const result = await service.findAll('course-1');

    expect(chapterRepository.findAndCount).toHaveBeenCalledWith({
      where: { courseId: 'course-1' },
      take: 10,
      skip: 0,
      order: { orderIndex: 'ASC' },
    });
    expect(result).toEqual([chapters, 1]);
  });

  it('returns a chapter by id when it exists', async () => {
    const chapter = createChapterEntity();
    chapterRepository.findOne.mockResolvedValue(chapter);

    const result = await service.findById(chapter.id);

    expect(chapterRepository.findOne).toHaveBeenCalledWith({
      where: { id: chapter.id },
    });
    expect(result).toEqual(chapter);
  });

  it('throws NotFoundException when the chapter does not exist', async () => {
    chapterRepository.findOne.mockResolvedValue(null);

    await expect(service.findById('missing-chapter')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns a chapter only when it belongs to the requested course', async () => {
    const chapter = createChapterEntity();
    chapterRepository.findOne.mockResolvedValue(chapter);

    const result = await service.findByIdInCourse('course-1', chapter.id);

    expect(chapterRepository.findOne).toHaveBeenCalledWith({
      where: { id: chapter.id, courseId: 'course-1' },
    });
    expect(result).toEqual(chapter);
  });

  it('throws NotFoundException when the chapter is not in the requested course', async () => {
    chapterRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findByIdInCourse('course-1', 'missing-chapter'),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates an existing chapter and saves the merged result', async () => {
    const existingChapter = createChapterEntity();
    const dto: UpdateChapterDto = {
      titleEn: 'Updated Introduction',
    };

    chapterRepository.findOne.mockResolvedValue(existingChapter);
    chapterRepository.find.mockResolvedValue([existingChapter]);
    chapterRepository.save.mockImplementation((chapter: Chapter) =>
      Promise.resolve(chapter),
    );

    const result = await service.update(existingChapter.id, dto);

    expect(chapterRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: existingChapter.id,
        titleEn: 'Updated Introduction',
        orderIndex: existingChapter.orderIndex,
        titleFi: existingChapter.titleFi,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: existingChapter.id,
        titleEn: 'Updated Introduction',
        orderIndex: existingChapter.orderIndex,
      }),
    );
  });

  it('throws NotFoundException when updating a missing chapter', async () => {
    chapterRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update('missing-chapter', { titleEn: 'Nobody' }),
    ).rejects.toThrow(NotFoundException);

    expect(chapterRepository.save).not.toHaveBeenCalled();
  });

  it('deletes an existing chapter after loading it first', async () => {
    const chapter = createChapterEntity();
    chapterRepository.findOne.mockResolvedValue(chapter);
    chapterRepository.find.mockResolvedValue([chapter]);
    chapterRepository.remove.mockResolvedValue(undefined);

    await service.delete(chapter.id);

    // Loading first keeps the delete flow aligned with the explicit not-found behavior.
    expect(chapterRepository.remove).toHaveBeenCalledWith(chapter);
  });

  it('throws NotFoundException when deleting a missing chapter', async () => {
    chapterRepository.findOne.mockResolvedValue(null);

    await expect(service.delete('missing-chapter')).rejects.toThrow(
      NotFoundException,
    );

    expect(chapterRepository.remove).not.toHaveBeenCalled();
  });

  it('shifts later chapters when creating a chapter in the middle', async () => {
    const firstChapter = createChapterEntity();
    const secondChapter = createChapterEntity();
    secondChapter.id = 'chapter-2';
    secondChapter.orderIndex = 2;

    const createdChapter = createChapterEntity();
    createdChapter.id = 'chapter-new';
    createdChapter.orderIndex = 2;

    courseRepository.findOne.mockResolvedValue(createCourseEntity());
    chapterRepository.find.mockResolvedValue([firstChapter, secondChapter]);
    chapterRepository.create.mockReturnValue(createdChapter);
    chapterRepository.save
      .mockResolvedValueOnce([firstChapter, secondChapter])
      .mockResolvedValueOnce(createdChapter);

    const result = await service.create('course-1', {
      titleEn: 'Inserted chapter',
      titleFi: 'Inserted chapter',
      descriptionEn: 'Inserted chapter',
      descriptionFi: 'Inserted chapter',
      orderIndex: 2,
    });

    expect(secondChapter.orderIndex).toBe(3);
    expect(chapterRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ orderIndex: 2, courseId: 'course-1' }),
    );
    expect(result).toEqual(createdChapter);
  });

  it('normalizes duplicate legacy chapter orders before inserting a new chapter', async () => {
    const firstChapter = createChapterEntity();
    const secondChapter = createChapterEntity();
    secondChapter.id = 'chapter-2';
    secondChapter.orderIndex = 1;

    const createdChapter = createChapterEntity();
    createdChapter.id = 'chapter-new';
    createdChapter.orderIndex = 1;

    courseRepository.findOne.mockResolvedValue(createCourseEntity());
    chapterRepository.find.mockResolvedValue([firstChapter, secondChapter]);
    chapterRepository.create.mockReturnValue(createdChapter);
    chapterRepository.save
      .mockResolvedValueOnce([secondChapter])
      .mockResolvedValueOnce([firstChapter, secondChapter])
      .mockResolvedValueOnce(createdChapter);

    await service.create('course-1', {
      titleEn: 'Inserted chapter',
      titleFi: 'Inserted chapter',
      descriptionEn: 'Inserted chapter',
      descriptionFi: 'Inserted chapter',
      orderIndex: 1,
    });

    expect(firstChapter.orderIndex).toBe(2);
    expect(secondChapter.orderIndex).toBe(3);
  });

  it('reorders sibling chapters when a chapter moves up', async () => {
    const firstChapter = createChapterEntity();
    const secondChapter = createChapterEntity();
    secondChapter.id = 'chapter-2';
    secondChapter.orderIndex = 2;
    const thirdChapter = createChapterEntity();
    thirdChapter.id = 'chapter-3';
    thirdChapter.orderIndex = 3;

    chapterRepository.findOne.mockResolvedValue(thirdChapter);
    chapterRepository.find.mockResolvedValue([
      firstChapter,
      secondChapter,
      thirdChapter,
    ]);
    chapterRepository.save.mockImplementation((chapter: Chapter | Chapter[]) =>
      Promise.resolve(chapter),
    );

    const result = await service.update('chapter-3', { orderIndex: 1 });

    expect(firstChapter.orderIndex).toBe(2);
    expect(secondChapter.orderIndex).toBe(3);
    expect(result).toEqual(
      expect.objectContaining({ id: 'chapter-3', orderIndex: 1 }),
    );
  });

  it('closes order gaps after deleting a chapter', async () => {
    const firstChapter = createChapterEntity();
    const secondChapter = createChapterEntity();
    secondChapter.id = 'chapter-2';
    secondChapter.orderIndex = 2;
    const thirdChapter = createChapterEntity();
    thirdChapter.id = 'chapter-3';
    thirdChapter.orderIndex = 3;

    chapterRepository.findOne.mockResolvedValue(secondChapter);
    chapterRepository.find.mockResolvedValue([
      firstChapter,
      secondChapter,
      thirdChapter,
    ]);
    chapterRepository.remove.mockResolvedValue(undefined);
    chapterRepository.save.mockResolvedValue([thirdChapter]);

    await service.delete('chapter-2');

    expect(thirdChapter.orderIndex).toBe(2);
    expect(chapterRepository.save).toHaveBeenCalledWith([thirdChapter]);
  });
});
