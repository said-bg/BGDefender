import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from '../../entities/author.entity';
import { CreateAuthorDto } from '../dto/create-author.dto';
import { UpdateAuthorDto } from '../dto/update-author.dto';
import { AuthorService } from './author.service';

type MockAuthorRepository = Pick<
  Repository<Author>,
  'create' | 'save' | 'findAndCount' | 'findOne' | 'remove'
> & {
  create: jest.Mock;
  save: jest.Mock;
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  remove: jest.Mock;
};

const createAuthorEntity = (): Author =>
  ({
    id: 'author-1',
    name: 'Said Ait Baha',
    roleEn: 'Cybersecurity Trainer',
    roleFi: 'Kyberturvallisuuden kouluttaja',
    biographyEn: 'Hands-on offensive security specialist.',
    biographyFi: 'Käytännönläheinen hyökkäävän tietoturvan asiantuntija.',
    photo: '/uploads/authors/said.jpg',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  }) as Author;

describe('AuthorService', () => {
  let service: AuthorService;
  let authorRepository: MockAuthorRepository;

  beforeEach(async () => {
    authorRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorService,
        {
          provide: getRepositoryToken(Author),
          useValue: authorRepository,
        },
      ],
    }).compile();

    service = module.get<AuthorService>(AuthorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates an author from the incoming dto', async () => {
    const dto: CreateAuthorDto = {
      name: 'Said Ait Baha',
      roleEn: 'Cybersecurity Trainer',
      roleFi: 'Kyberturvallisuuden kouluttaja',
      biographyEn: 'Hands-on offensive security specialist.',
      biographyFi: 'Käytännönläheinen hyökkäävän tietoturvan asiantuntija.',
      photo: '/uploads/authors/said.jpg',
    };
    const createdAuthor = createAuthorEntity();

    // The repository is mocked so we can focus only on the service behavior.
    authorRepository.create.mockReturnValue(createdAuthor);
    authorRepository.save.mockResolvedValue(createdAuthor);

    const result = await service.create(dto);

    // We verify both the repository interaction and the returned business object.
    expect(authorRepository.create).toHaveBeenCalledWith(dto);
    expect(authorRepository.save).toHaveBeenCalledWith(createdAuthor);
    expect(result).toEqual(createdAuthor);
  });

  it('lists authors with pagination and descending creation order', async () => {
    const authors = [createAuthorEntity()];
    authorRepository.findAndCount.mockResolvedValue([authors, 1]);

    const result = await service.findAll(25, 5);

    expect(authorRepository.findAndCount).toHaveBeenCalledWith({
      take: 25,
      skip: 5,
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual([authors, 1]);
  });

  it('uses default pagination values when none are provided', async () => {
    const authors = [createAuthorEntity()];
    authorRepository.findAndCount.mockResolvedValue([authors, 1]);

    // This test protects the implicit contract created by the default parameters.
    const result = await service.findAll();

    expect(authorRepository.findAndCount).toHaveBeenCalledWith({
      take: 10,
      skip: 0,
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual([authors, 1]);
  });

  it('returns an author by id when it exists', async () => {
    const author = createAuthorEntity();
    authorRepository.findOne.mockResolvedValue(author);

    const result = await service.findById(author.id);

    expect(authorRepository.findOne).toHaveBeenCalledWith({
      where: { id: author.id },
    });
    expect(result).toEqual(author);
  });

  it('throws NotFoundException when the author does not exist', async () => {
    // Simulates the "not found in database" path.
    authorRepository.findOne.mockResolvedValue(null);

    await expect(service.findById('missing-author')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates an existing author and saves the merged result', async () => {
    const existingAuthor = createAuthorEntity();
    const dto: UpdateAuthorDto = {
      name: 'Updated Author',
      biographyEn: 'Updated English biography.',
    };

    authorRepository.findOne.mockResolvedValue(existingAuthor);
    authorRepository.save.mockImplementation((author: Author) =>
      Promise.resolve(author),
    );

    const result = await service.update(existingAuthor.id, dto);

    expect(authorRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: existingAuthor.id,
        name: 'Updated Author',
        biographyEn: 'Updated English biography.',
        biographyFi: existingAuthor.biographyFi,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: existingAuthor.id,
        name: 'Updated Author',
        biographyEn: 'Updated English biography.',
      }),
    );
  });

  it('throws NotFoundException when updating a missing author', async () => {
    authorRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update('missing-author', { name: 'Nobody' }),
    ).rejects.toThrow(NotFoundException);

    // If loading fails, the service must stop before any write happens.
    expect(authorRepository.save).not.toHaveBeenCalled();
  });

  it('deletes an existing author after loading it first', async () => {
    const author = createAuthorEntity();
    authorRepository.findOne.mockResolvedValue(author);
    authorRepository.remove.mockResolvedValue(undefined);

    await service.delete(author.id);

    // The service loads first so it can raise a clean NotFoundException if needed.
    expect(authorRepository.remove).toHaveBeenCalledWith(author);
  });

  it('throws NotFoundException when deleting a missing author', async () => {
    authorRepository.findOne.mockResolvedValue(null);

    await expect(service.delete('missing-author')).rejects.toThrow(
      NotFoundException,
    );

    expect(authorRepository.remove).not.toHaveBeenCalled();
  });
});
