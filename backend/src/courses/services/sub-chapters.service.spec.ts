import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';
import { SubChapter } from '../../entities/sub-chapter.entity';
import { CreateSubChapterDto } from '../dto/create-sub-chapter.dto';
import { UpdateSubChapterDto } from '../dto/update-sub-chapter.dto';
import { SubChapterService } from './sub-chapters.service';

type MockSubChapterRepository = Pick<
  Repository<SubChapter>,
  'create' | 'save' | 'findAndCount' | 'findOne' | 'remove'
> & {
  create: jest.Mock;
  save: jest.Mock;
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  remove: jest.Mock;
};

type MockChapterRepository = Pick<Repository<Chapter>, 'findOne'> & {
  findOne: jest.Mock;
};

const createChapterEntity = (): Chapter =>
  ({
    id: 'chapter-1',
    titleEn: 'Recon Basics',
    titleFi: 'Recon perusteet',
    descriptionEn: 'Learn reconnaissance fundamentals.',
    descriptionFi: 'Opiskele tiedustelun perusteet.',
    orderIndex: 1,
    courseId: 'course-1',
    course: undefined,
    subChapters: [],
    trainingQuiz: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  }) as Chapter;

const createSubChapterEntity = (): SubChapter =>
  ({
    id: 'sub-chapter-1',
    titleEn: 'Passive Recon',
    titleFi: 'Passiivinen tiedustelu',
    descriptionEn: 'Gather information without touching the target.',
    descriptionFi: 'Kerää tietoa koskematta kohteeseen.',
    orderIndex: 1,
    chapterId: 'chapter-1',
    chapter: createChapterEntity(),
    pedagogicalContents: [],
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-04T00:00:00.000Z'),
  }) as SubChapter;

describe('SubChapterService', () => {
  let service: SubChapterService;
  let subChapterRepository: MockSubChapterRepository;
  let chapterRepository: MockChapterRepository;

  beforeEach(async () => {
    subChapterRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    chapterRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubChapterService,
        {
          provide: getRepositoryToken(SubChapter),
          useValue: subChapterRepository,
        },
        {
          provide: getRepositoryToken(Chapter),
          useValue: chapterRepository,
        },
      ],
    }).compile();

    service = module.get<SubChapterService>(SubChapterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a subchapter for an existing chapter', async () => {
    const dto: CreateSubChapterDto = {
      titleEn: 'Passive Recon',
      titleFi: 'Passiivinen tiedustelu',
      descriptionEn: 'Gather information without touching the target.',
      descriptionFi: 'Kerää tietoa koskematta kohteeseen.',
      orderIndex: 1,
    };
    const chapter = createChapterEntity();
    const createdSubChapter = createSubChapterEntity();

    chapterRepository.findOne.mockResolvedValue(chapter);
    subChapterRepository.create.mockReturnValue(createdSubChapter);
    subChapterRepository.save.mockResolvedValue(createdSubChapter);

    const result = await service.create(chapter.id, dto);

    // The service must bind the new subchapter to its parent chapter before saving it.
    expect(subChapterRepository.create).toHaveBeenCalledWith({
      ...dto,
      chapterId: chapter.id,
    });
    expect(subChapterRepository.save).toHaveBeenCalledWith(createdSubChapter);
    expect(result).toEqual(createdSubChapter);
  });

  it('throws NotFoundException when creating a subchapter for a missing chapter', async () => {
    chapterRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create('missing-chapter', {
        titleEn: 'Passive Recon',
        titleFi: 'Passiivinen tiedustelu',
        descriptionEn: 'Gather information without touching the target.',
        descriptionFi: 'Kerää tietoa koskematta kohteeseen.',
        orderIndex: 1,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(subChapterRepository.create).not.toHaveBeenCalled();
    expect(subChapterRepository.save).not.toHaveBeenCalled();
  });

  it('lists subchapters for a chapter with pagination and ascending order', async () => {
    const subChapters = [createSubChapterEntity()];
    subChapterRepository.findAndCount.mockResolvedValue([subChapters, 1]);

    const result = await service.findAll('chapter-1', 25, 5);

    expect(subChapterRepository.findAndCount).toHaveBeenCalledWith({
      where: { chapterId: 'chapter-1' },
      take: 25,
      skip: 5,
      order: { orderIndex: 'ASC' },
    });
    expect(result).toEqual([subChapters, 1]);
  });

  it('uses default pagination values when none are provided', async () => {
    const subChapters = [createSubChapterEntity()];
    subChapterRepository.findAndCount.mockResolvedValue([subChapters, 1]);

    const result = await service.findAll('chapter-1');

    expect(subChapterRepository.findAndCount).toHaveBeenCalledWith({
      where: { chapterId: 'chapter-1' },
      take: 10,
      skip: 0,
      order: { orderIndex: 'ASC' },
    });
    expect(result).toEqual([subChapters, 1]);
  });

  it('returns a subchapter by id when it exists', async () => {
    const subChapter = createSubChapterEntity();
    subChapterRepository.findOne.mockResolvedValue(subChapter);

    const result = await service.findById(subChapter.id);

    expect(subChapterRepository.findOne).toHaveBeenCalledWith({
      where: { id: subChapter.id },
    });
    expect(result).toEqual(subChapter);
  });

  it('throws NotFoundException when the subchapter does not exist', async () => {
    subChapterRepository.findOne.mockResolvedValue(null);

    await expect(service.findById('missing-subchapter')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns a subchapter only when it belongs to the requested chapter', async () => {
    const subChapter = createSubChapterEntity();
    subChapterRepository.findOne.mockResolvedValue(subChapter);

    const result = await service.findByIdInChapter('chapter-1', subChapter.id);

    expect(subChapterRepository.findOne).toHaveBeenCalledWith({
      where: { id: subChapter.id, chapterId: 'chapter-1' },
    });
    expect(result).toEqual(subChapter);
  });

  it('throws NotFoundException when the subchapter is not in the requested chapter', async () => {
    subChapterRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findByIdInChapter('chapter-1', 'missing-subchapter'),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates an existing subchapter and saves the merged result', async () => {
    const existingSubChapter = createSubChapterEntity();
    const dto: UpdateSubChapterDto = {
      titleEn: 'Updated Passive Recon',
      orderIndex: 2,
    };

    subChapterRepository.findOne.mockResolvedValue(existingSubChapter);
    subChapterRepository.save.mockImplementation((subChapter: SubChapter) =>
      Promise.resolve(subChapter),
    );

    const result = await service.update(existingSubChapter.id, dto);

    expect(subChapterRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: existingSubChapter.id,
        titleEn: 'Updated Passive Recon',
        orderIndex: 2,
        titleFi: existingSubChapter.titleFi,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: existingSubChapter.id,
        titleEn: 'Updated Passive Recon',
        orderIndex: 2,
      }),
    );
  });

  it('throws NotFoundException when updating a missing subchapter', async () => {
    subChapterRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update('missing-subchapter', { titleEn: 'Nobody' }),
    ).rejects.toThrow(NotFoundException);

    expect(subChapterRepository.save).not.toHaveBeenCalled();
  });

  it('deletes an existing subchapter after loading it first', async () => {
    const subChapter = createSubChapterEntity();
    subChapterRepository.findOne.mockResolvedValue(subChapter);
    subChapterRepository.remove.mockResolvedValue(undefined);

    await service.delete(subChapter.id);

    // Loading first keeps delete behavior explicit and consistent with the service contract.
    expect(subChapterRepository.remove).toHaveBeenCalledWith(subChapter);
  });

  it('throws NotFoundException when deleting a missing subchapter', async () => {
    subChapterRepository.findOne.mockResolvedValue(null);

    await expect(service.delete('missing-subchapter')).rejects.toThrow(
      NotFoundException,
    );

    expect(subChapterRepository.remove).not.toHaveBeenCalled();
  });
});
