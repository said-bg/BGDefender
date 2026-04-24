import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentType } from '../../entities/content-type.enum';
import { PedagogicalContent } from '../../entities/pedagogical-content.entity';
import { SubChapter } from '../../entities/sub-chapter.entity';
import { CreatePedagogicalContentDto } from '../dto/create-pedagogical-content.dto';
import { UpdatePedagogicalContentDto } from '../dto/update-pedagogical-content.dto';
import { PedagogicalContentService } from './pedagogical-contents.service';

type MockPedagogicalContentRepository = Pick<
  Repository<PedagogicalContent>,
  'create' | 'save' | 'find' | 'findAndCount' | 'findOne' | 'remove'
> & {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  remove: jest.Mock;
};

type MockSubChapterRepository = Pick<Repository<SubChapter>, 'findOne'> & {
  findOne: jest.Mock;
};

const createSubChapterEntity = (): SubChapter =>
  ({
    id: 'sub-chapter-1',
    titleEn: 'Passive Recon',
    titleFi: 'Passiivinen tiedustelu',
    descriptionEn: 'Gather information without touching the target.',
    descriptionFi: 'Kerää tietoa koskematta kohteeseen.',
    orderIndex: 1,
    chapterId: 'chapter-1',
    chapter: undefined,
    pedagogicalContents: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  }) as SubChapter;

const createPedagogicalContentEntity = (): PedagogicalContent =>
  ({
    id: 'content-1',
    titleEn: 'Passive Recon Checklist',
    titleFi: 'Passiivisen tiedustelun muistilista',
    type: ContentType.TEXT,
    contentEn: 'Start by mapping public sources.',
    contentFi: 'Aloita kartoittamalla julkiset lähteet.',
    url: null,
    orderIndex: 1,
    subChapterId: 'sub-chapter-1',
    subChapter: createSubChapterEntity(),
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-04T00:00:00.000Z'),
  }) as PedagogicalContent;

describe('PedagogicalContentService', () => {
  let service: PedagogicalContentService;
  let pedagogicalContentRepository: MockPedagogicalContentRepository;
  let subChapterRepository: MockSubChapterRepository;

  beforeEach(async () => {
    pedagogicalContentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    subChapterRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedagogicalContentService,
        {
          provide: getRepositoryToken(PedagogicalContent),
          useValue: pedagogicalContentRepository,
        },
        {
          provide: getRepositoryToken(SubChapter),
          useValue: subChapterRepository,
        },
      ],
    }).compile();

    service = module.get<PedagogicalContentService>(PedagogicalContentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates pedagogical content for an existing subchapter', async () => {
    const dto: CreatePedagogicalContentDto = {
      titleEn: 'Passive Recon Checklist',
      titleFi: 'Passiivisen tiedustelun muistilista',
      type: ContentType.TEXT,
      contentEn: 'Start by mapping public sources.',
      contentFi: 'Aloita kartoittamalla julkiset lähteet.',
      orderIndex: 1,
    };
    const subChapter = createSubChapterEntity();
    const createdContent = createPedagogicalContentEntity();

    subChapterRepository.findOne.mockResolvedValue(subChapter);
    pedagogicalContentRepository.find.mockResolvedValue([]);
    pedagogicalContentRepository.create.mockReturnValue(createdContent);
    pedagogicalContentRepository.save.mockResolvedValue(createdContent);

    const result = await service.create(subChapter.id, dto);

    // The parent subchapter must be validated first, then linked on the new content.
    expect(pedagogicalContentRepository.create).toHaveBeenCalledWith({
      ...dto,
      subChapterId: subChapter.id,
    });
    expect(pedagogicalContentRepository.save).toHaveBeenCalledWith(
      createdContent,
    );
    expect(result).toEqual(createdContent);
  });

  it('throws NotFoundException when creating content for a missing subchapter', async () => {
    subChapterRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create('missing-subchapter', {
        titleEn: 'Passive Recon Checklist',
        titleFi: 'Passiivisen tiedustelun muistilista',
        type: ContentType.TEXT,
        contentEn: 'Start by mapping public sources.',
        contentFi: 'Aloita kartoittamalla julkiset lähteet.',
        orderIndex: 1,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(pedagogicalContentRepository.create).not.toHaveBeenCalled();
    expect(pedagogicalContentRepository.save).not.toHaveBeenCalled();
  });

  it('lists pedagogical contents for a subchapter with pagination and ascending order', async () => {
    const contents = [createPedagogicalContentEntity()];
    pedagogicalContentRepository.findAndCount.mockResolvedValue([contents, 1]);

    const result = await service.findAll('sub-chapter-1', 25, 5);

    expect(pedagogicalContentRepository.findAndCount).toHaveBeenCalledWith({
      where: { subChapterId: 'sub-chapter-1' },
      take: 25,
      skip: 5,
      order: { orderIndex: 'ASC' },
    });
    expect(result).toEqual([contents, 1]);
  });

  it('uses default pagination values when none are provided', async () => {
    const contents = [createPedagogicalContentEntity()];
    pedagogicalContentRepository.findAndCount.mockResolvedValue([contents, 1]);

    const result = await service.findAll('sub-chapter-1');

    expect(pedagogicalContentRepository.findAndCount).toHaveBeenCalledWith({
      where: { subChapterId: 'sub-chapter-1' },
      take: 10,
      skip: 0,
      order: { orderIndex: 'ASC' },
    });
    expect(result).toEqual([contents, 1]);
  });

  it('returns pedagogical content by id when it exists', async () => {
    const content = createPedagogicalContentEntity();
    pedagogicalContentRepository.findOne.mockResolvedValue(content);

    const result = await service.findById(content.id);

    expect(pedagogicalContentRepository.findOne).toHaveBeenCalledWith({
      where: { id: content.id },
    });
    expect(result).toEqual(content);
  });

  it('throws NotFoundException when the pedagogical content does not exist', async () => {
    pedagogicalContentRepository.findOne.mockResolvedValue(null);

    await expect(service.findById('missing-content')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns content only when it belongs to the requested subchapter', async () => {
    const content = createPedagogicalContentEntity();
    pedagogicalContentRepository.findOne.mockResolvedValue(content);

    const result = await service.findByIdInSubChapter(
      'sub-chapter-1',
      content.id,
    );

    expect(pedagogicalContentRepository.findOne).toHaveBeenCalledWith({
      where: { id: content.id, subChapterId: 'sub-chapter-1' },
    });
    expect(result).toEqual(content);
  });

  it('throws NotFoundException when the content is not in the requested subchapter', async () => {
    pedagogicalContentRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findByIdInSubChapter('sub-chapter-1', 'missing-content'),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates existing pedagogical content and saves the merged result', async () => {
    const existingContent = createPedagogicalContentEntity();
    const dto: UpdatePedagogicalContentDto = {
      titleEn: 'Updated Passive Recon Checklist',
      url: 'https://example.com/recon',
      type: ContentType.LINK,
    };

    pedagogicalContentRepository.findOne.mockResolvedValue(existingContent);
    pedagogicalContentRepository.find.mockResolvedValue([existingContent]);
    pedagogicalContentRepository.save.mockImplementation(
      (content: PedagogicalContent) => Promise.resolve(content),
    );

    const result = await service.update(existingContent.id, dto);

    expect(pedagogicalContentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: existingContent.id,
        titleEn: 'Updated Passive Recon Checklist',
        url: 'https://example.com/recon',
        type: ContentType.LINK,
        orderIndex: existingContent.orderIndex,
        titleFi: existingContent.titleFi,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: existingContent.id,
        titleEn: 'Updated Passive Recon Checklist',
        url: 'https://example.com/recon',
        type: ContentType.LINK,
        orderIndex: existingContent.orderIndex,
      }),
    );
  });

  it('throws NotFoundException when updating missing pedagogical content', async () => {
    pedagogicalContentRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update('missing-content', { titleEn: 'Nobody' }),
    ).rejects.toThrow(NotFoundException);

    expect(pedagogicalContentRepository.save).not.toHaveBeenCalled();
  });

  it('deletes existing pedagogical content after loading it first', async () => {
    const content = createPedagogicalContentEntity();
    pedagogicalContentRepository.findOne.mockResolvedValue(content);
    pedagogicalContentRepository.find.mockResolvedValue([content]);
    pedagogicalContentRepository.remove.mockResolvedValue(undefined);

    await service.delete(content.id);

    // This keeps delete behavior explicit and aligned with the service not-found contract.
    expect(pedagogicalContentRepository.remove).toHaveBeenCalledWith(content);
  });

  it('throws NotFoundException when deleting missing pedagogical content', async () => {
    pedagogicalContentRepository.findOne.mockResolvedValue(null);

    await expect(service.delete('missing-content')).rejects.toThrow(
      NotFoundException,
    );

    expect(pedagogicalContentRepository.remove).not.toHaveBeenCalled();
  });

  it('shifts later content blocks when creating one in the middle', async () => {
    const firstContent = createPedagogicalContentEntity();
    const secondContent = createPedagogicalContentEntity();
    secondContent.id = 'content-2';
    secondContent.orderIndex = 2;
    const createdContent = createPedagogicalContentEntity();
    createdContent.id = 'content-new';
    createdContent.orderIndex = 2;

    subChapterRepository.findOne.mockResolvedValue(createSubChapterEntity());
    pedagogicalContentRepository.find.mockResolvedValue([
      firstContent,
      secondContent,
    ]);
    pedagogicalContentRepository.create.mockReturnValue(createdContent);
    pedagogicalContentRepository.save
      .mockResolvedValueOnce([firstContent, secondContent])
      .mockResolvedValueOnce(createdContent);

    const result = await service.create('sub-chapter-1', {
      titleEn: 'Inserted block',
      titleFi: 'Inserted block',
      type: ContentType.TEXT,
      contentEn: 'Inserted block',
      contentFi: 'Inserted block',
      orderIndex: 2,
    });

    expect(secondContent.orderIndex).toBe(3);
    expect(result).toEqual(createdContent);
  });

  it('normalizes duplicate legacy content orders before inserting a new block', async () => {
    const firstContent = createPedagogicalContentEntity();
    const secondContent = createPedagogicalContentEntity();
    secondContent.id = 'content-2';
    secondContent.orderIndex = 1;
    const createdContent = createPedagogicalContentEntity();
    createdContent.id = 'content-new';
    createdContent.orderIndex = 1;

    subChapterRepository.findOne.mockResolvedValue(createSubChapterEntity());
    pedagogicalContentRepository.find.mockResolvedValue([
      firstContent,
      secondContent,
    ]);
    pedagogicalContentRepository.create.mockReturnValue(createdContent);
    pedagogicalContentRepository.save
      .mockResolvedValueOnce([secondContent])
      .mockResolvedValueOnce([firstContent, secondContent])
      .mockResolvedValueOnce(createdContent);

    await service.create('sub-chapter-1', {
      titleEn: 'Inserted block',
      titleFi: 'Inserted block',
      type: ContentType.TEXT,
      contentEn: 'Inserted block',
      contentFi: 'Inserted block',
      orderIndex: 1,
    });

    expect(firstContent.orderIndex).toBe(2);
    expect(secondContent.orderIndex).toBe(3);
  });

  it('reorders sibling content blocks when one moves up', async () => {
    const firstContent = createPedagogicalContentEntity();
    const secondContent = createPedagogicalContentEntity();
    secondContent.id = 'content-2';
    secondContent.orderIndex = 2;
    const thirdContent = createPedagogicalContentEntity();
    thirdContent.id = 'content-3';
    thirdContent.orderIndex = 3;

    pedagogicalContentRepository.findOne.mockResolvedValue(thirdContent);
    pedagogicalContentRepository.find.mockResolvedValue([
      firstContent,
      secondContent,
      thirdContent,
    ]);
    pedagogicalContentRepository.save.mockImplementation(
      (content: PedagogicalContent | PedagogicalContent[]) =>
        Promise.resolve(content),
    );

    const result = await service.update('content-3', { orderIndex: 1 });

    expect(firstContent.orderIndex).toBe(2);
    expect(secondContent.orderIndex).toBe(3);
    expect(result).toEqual(
      expect.objectContaining({ id: 'content-3', orderIndex: 1 }),
    );
  });

  it('closes order gaps after deleting a content block', async () => {
    const firstContent = createPedagogicalContentEntity();
    const secondContent = createPedagogicalContentEntity();
    secondContent.id = 'content-2';
    secondContent.orderIndex = 2;
    const thirdContent = createPedagogicalContentEntity();
    thirdContent.id = 'content-3';
    thirdContent.orderIndex = 3;

    pedagogicalContentRepository.findOne.mockResolvedValue(secondContent);
    pedagogicalContentRepository.find.mockResolvedValue([
      firstContent,
      secondContent,
      thirdContent,
    ]);
    pedagogicalContentRepository.remove.mockResolvedValue(undefined);
    pedagogicalContentRepository.save.mockResolvedValue([thirdContent]);

    await service.delete('content-2');

    expect(thirdContent.orderIndex).toBe(2);
    expect(pedagogicalContentRepository.save).toHaveBeenCalledWith([
      thirdContent,
    ]);
  });
});
