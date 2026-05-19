import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { Author } from '../../entities/author.entity';
import { UserPlan, UserRole } from '../../entities/user.entity';
import { CreateAuthorDto } from '../dto/create-author.dto';
import { UpdateAuthorDto } from '../dto/update-author.dto';
import { AuthorService } from './author.service';

type MockAuthorRepository = Pick<
  Repository<Author>,
  'create' | 'save' | 'find' | 'findAndCount' | 'findOne' | 'remove'
> & {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  remove: jest.Mock;
};

const createAuthorEntity = (overrides: Partial<Author> = {}): Author =>
  ({
    id: 'author-1',
    name: 'Said Ait Baha',
    roleEn: 'Cybersecurity Trainer',
    roleFi: 'Kyberturvallisuuden kouluttaja',
    biographyEn: 'Hands-on offensive security specialist.',
    biographyFi: 'Kaytannonlaheinen hyokkaavan tietoturvan asiantuntija.',
    photo: '/uploads/authors/said.jpg',
    ownerUserId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }) as Author;

describe('AuthorService', () => {
  let service: AuthorService;
  let authorRepository: MockAuthorRepository;

  const adminUser: SafeUser = {
    id: 1,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    occupation: null,
    role: UserRole.ADMIN,
    plan: UserPlan.PREMIUM,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const creatorUser: SafeUser = {
    id: 8,
    email: 'creator@example.com',
    firstName: 'Creator',
    lastName: 'User',
    occupation: null,
    role: UserRole.CREATOR,
    plan: UserPlan.FREE,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    authorRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
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
      biographyFi: 'Kaytannonlaheinen hyokkaavan tietoturvan asiantuntija.',
      photo: '/uploads/authors/said.jpg',
    };
    const createdAuthor = createAuthorEntity();

    authorRepository.create.mockReturnValue(createdAuthor);
    authorRepository.save.mockResolvedValue(createdAuthor);

    const result = await service.create(dto, adminUser);

    expect(authorRepository.create).toHaveBeenCalledWith({
      ...dto,
      ownerUserId: adminUser.id,
    });
    expect(authorRepository.save).toHaveBeenCalledWith(createdAuthor);
    expect(result).toEqual(createdAuthor);
  });

  it('lists admin authors with legacy unowned authors included', async () => {
    const authors = [createAuthorEntity()];
    authorRepository.findAndCount.mockResolvedValue([authors, 1]);

    const result = await service.findAll(adminUser, 25, 5);

    expect(authorRepository.findAndCount).toHaveBeenCalledWith({
      where: [
        { ownerUserId: adminUser.id },
        { ownerUserId: expect.anything() },
      ],
      take: 25,
      skip: 5,
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual([authors, 1]);
  });

  it('lists creator authors with default pagination values', async () => {
    const authors = [createAuthorEntity({ ownerUserId: creatorUser.id })];
    authorRepository.findAndCount.mockResolvedValue([authors, 1]);

    const result = await service.findAll(creatorUser);

    expect(authorRepository.findAndCount).toHaveBeenCalledWith({
      where: { ownerUserId: creatorUser.id },
      take: 10,
      skip: 0,
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual([authors, 1]);
  });

  it('returns an owned author by id when it exists', async () => {
    const author = createAuthorEntity();
    authorRepository.findOne.mockResolvedValue(author);

    const result = await service.findById(author.id, adminUser);

    expect(authorRepository.findOne).toHaveBeenCalledWith({
      where: { id: author.id },
    });
    expect(result).toEqual(author);
  });

  it('throws NotFoundException when the author does not exist', async () => {
    authorRepository.findOne.mockResolvedValue(null);

    await expect(service.findById('missing-author', adminUser)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('blocks access to another owner author', async () => {
    authorRepository.findOne.mockResolvedValue(
      createAuthorEntity({ ownerUserId: adminUser.id }),
    );

    await expect(service.findById('author-1', creatorUser)).rejects.toThrow(
      ForbiddenException,
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

    const result = await service.update(existingAuthor.id, dto, adminUser);

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
      service.update('missing-author', { name: 'Nobody' }, adminUser),
    ).rejects.toThrow(NotFoundException);

    expect(authorRepository.save).not.toHaveBeenCalled();
  });

  it('deletes an existing author after loading it first', async () => {
    const author = createAuthorEntity();
    authorRepository.findOne.mockResolvedValue(author);
    authorRepository.remove.mockResolvedValue(undefined);

    await service.delete(author.id, adminUser);

    expect(authorRepository.remove).toHaveBeenCalledWith(author);
  });

  it('throws NotFoundException when deleting a missing author', async () => {
    authorRepository.findOne.mockResolvedValue(null);

    await expect(service.delete('missing-author', adminUser)).rejects.toThrow(
      NotFoundException,
    );

    expect(authorRepository.remove).not.toHaveBeenCalled();
  });

  it('returns the course owner author library for admin review', async () => {
    const authors = [createAuthorEntity({ ownerUserId: creatorUser.id })];
    authorRepository.find.mockResolvedValue(authors);

    const result = await service.findAvailableForOwner(
      creatorUser.id,
      adminUser,
    );

    expect(authorRepository.find).toHaveBeenCalledWith({
      where: { ownerUserId: creatorUser.id },
      order: { updatedAt: 'DESC' },
    });
    expect(result).toEqual(authors);
  });
});
