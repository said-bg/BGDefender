import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import * as fs from 'fs';
import { dirname, join } from 'path';
import { NotificationsService } from '../../notifications/services/notifications.service';
import {
  Resource,
  ResourceSource,
  ResourceType,
} from '../../entities/resource.entity';
import { User, UserPlan, UserRole } from '../../entities/user.entity';
import { CreateAdminResourceDto } from '../dto/create-admin-resource.dto';
import { CreateMyResourceDto } from '../dto/create-my-resource.dto';
import { ListResourcesDto } from '../dto/list-resources.dto';
import { ResourcesService } from '../services/resources.service';

type MockResourceRepository = Pick<
  Repository<Resource>,
  'createQueryBuilder' | 'create' | 'save' | 'findOne' | 'find' | 'remove'
> & {
  createQueryBuilder: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  remove: jest.Mock;
};

type MockUserRepository = Pick<Repository<User>, 'findOne'> & {
  findOne: jest.Mock;
};

type MockQueryBuilder = {
  leftJoinAndSelect: jest.Mock;
  orderBy: jest.Mock;
  andWhere: jest.Mock;
  take: jest.Mock;
  skip: jest.Mock;
  getManyAndCount: jest.Mock;
};

const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 7,
    email: 'user@example.com',
    firstName: 'User',
    lastName: 'Example',
    occupation: null,
    password: 'hashed',
    role: UserRole.USER,
    plan: UserPlan.FREE,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }) as User;

const createMockResource = (
  overrides: Partial<Resource> = {},
  assignedUser: User = createMockUser(),
): Resource =>
  ({
    id: 'resource-1',
    title: 'Security policy',
    description: 'Latest PDF',
    type: ResourceType.FILE,
    fileUrl: 'http://localhost:3001/uploads/resources/policy.pdf',
    filename: 'policy.pdf',
    mimeType: 'application/pdf',
    linkUrl: null,
    source: ResourceSource.ADMIN,
    assignedUserId: assignedUser.id,
    assignedUser,
    createdByUserId: 1,
    createdByUser: null,
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-04T00:00:00.000Z'),
    ...overrides,
  }) as Resource;

const createResourceFixtureFile = (filename: string): (() => void) => {
  const filePath = join(process.cwd(), 'uploads', 'resources', filename);

  fs.mkdirSync(dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, 'test resource file');

  return () => fs.rmSync(filePath, { force: true });
};

const createMockQueryBuilder = (): MockQueryBuilder => {
  const queryBuilder: MockQueryBuilder = {
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    andWhere: jest.fn(),
    take: jest.fn(),
    skip: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
  queryBuilder.orderBy.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);
  queryBuilder.take.mockReturnValue(queryBuilder);
  queryBuilder.skip.mockReturnValue(queryBuilder);

  return queryBuilder;
};

describe('ResourcesService', () => {
  let service: ResourcesService;
  let resourceRepository: MockResourceRepository;
  let userRepository: MockUserRepository;
  let queryBuilder: MockQueryBuilder;

  const notificationsService = {
    notifyResourceShared: jest.fn(),
    deleteResourceNotifications: jest.fn(),
  };

  beforeEach(async () => {
    queryBuilder = createMockQueryBuilder();

    resourceRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        {
          provide: getRepositoryToken(Resource),
          useValue: resourceRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listAdminResources', () => {
    it('applies filters and returns mapped resource views', async () => {
      const resource = createMockResource();
      const query: ListResourcesDto = {
        search: 'policy',
        assignedUserId: 7,
        type: ResourceType.FILE,
        source: ResourceSource.ADMIN,
        limit: 25,
        offset: 5,
      };

      queryBuilder.getManyAndCount.mockResolvedValue([[resource], 1]);

      const result = await service.listAdminResources(query);

      // This verifies the admin list keeps chaining all requested filters before loading results.
      expect(resourceRepository.createQueryBuilder).toHaveBeenCalledWith(
        'resource',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'resource.assignedUser',
        'assignedUser',
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'resource.createdAt',
        'DESC',
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'resource.source = :adminSource',
        { adminSource: ResourceSource.ADMIN },
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        expect.any(Brackets),
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        3,
        'resource.assignedUserId = :assignedUserId',
        { assignedUserId: 7 },
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        4,
        'resource.type = :type',
        { type: ResourceType.FILE },
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(25);
      expect(queryBuilder.skip).toHaveBeenCalledWith(5);
      expect(result).toEqual({
        data: [
          expect.objectContaining({
            id: 'resource-1',
            assignedUserId: 7,
          }),
        ],
        count: 1,
      });
      expect(result.data[0].assignedUser.email).toBe('user@example.com');
    });

    it('lists admin resources without optional filters when query is minimal', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.listAdminResources({
        limit: 25,
        offset: 0,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'resource.source = :adminSource',
        { adminSource: ResourceSource.ADMIN },
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(25);
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual({ data: [], count: 0 });
    });
  });

  describe('createAdminResource', () => {
    it('creates an admin file resource, trims text fields and notifies the assigned user', async () => {
      const dto: CreateAdminResourceDto = {
        title: '  Security policy  ',
        description: '  Latest PDF  ',
        type: ResourceType.FILE,
        fileUrl: 'http://localhost:3001/uploads/resources/policy.pdf',
        filename: 'policy.pdf',
        mimeType: 'application/pdf',
        assignedUserId: 7,
      };
      const assignedUser = createMockUser();
      const createdResource = createMockResource({}, assignedUser);
      const savedResource = createMockResource(
        {
          title: 'Security policy',
          description: 'Latest PDF',
        },
        assignedUser,
      );

      userRepository.findOne.mockResolvedValue(assignedUser);
      resourceRepository.create.mockReturnValue(createdResource);
      resourceRepository.save.mockResolvedValue(savedResource);

      const result = await service.createAdminResource(dto, 1);

      expect(resourceRepository.create).toHaveBeenCalledWith({
        title: 'Security policy',
        description: 'Latest PDF',
        type: ResourceType.FILE,
        fileUrl: dto.fileUrl,
        filename: dto.filename,
        mimeType: dto.mimeType,
        linkUrl: null,
        source: ResourceSource.ADMIN,
        assignedUserId: 7,
        createdByUserId: 1,
      });
      expect(notificationsService.notifyResourceShared).toHaveBeenCalledWith(
        7,
        savedResource.id,
        savedResource.title,
      );
      expect(result).toEqual(
        expect.objectContaining({
          source: ResourceSource.ADMIN,
          assignedUserId: 7,
        }),
      );
      expect(result.assignedUser.email).toBe(assignedUser.email);
    });

    it('creates an admin link resource and clears file-only fields', async () => {
      const dto: CreateAdminResourceDto = {
        title: 'Threat intel feed',
        description: 'Useful link',
        type: ResourceType.LINK,
        linkUrl: 'https://example.com/feed',
        assignedUserId: 7,
      };
      const assignedUser = createMockUser();
      const createdResource = createMockResource(
        {
          type: ResourceType.LINK,
          fileUrl: null,
          filename: null,
          mimeType: null,
          linkUrl: dto.linkUrl,
        },
        assignedUser,
      );

      userRepository.findOne.mockResolvedValue(assignedUser);
      resourceRepository.create.mockReturnValue(createdResource);
      resourceRepository.save.mockResolvedValue(createdResource);

      await service.createAdminResource(dto, 1);

      expect(resourceRepository.create).toHaveBeenCalledWith({
        title: 'Threat intel feed',
        description: 'Useful link',
        type: ResourceType.LINK,
        fileUrl: null,
        filename: null,
        mimeType: null,
        linkUrl: 'https://example.com/feed',
        source: ResourceSource.ADMIN,
        assignedUserId: 7,
        createdByUserId: 1,
      });
    });

    it('throws when assigned user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createAdminResource(
          {
            title: 'Guide',
            type: ResourceType.LINK,
            linkUrl: 'https://example.com',
            assignedUserId: 999,
          },
          1,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(resourceRepository.create).not.toHaveBeenCalled();
      expect(notificationsService.notifyResourceShared).not.toHaveBeenCalled();
    });

    it('throws a translated error when a file resource is missing its upload', async () => {
      await expect(
        service.createAdminResource(
          {
            title: 'Policy',
            type: ResourceType.FILE,
            assignedUserId: 7,
          },
          1,
          'fi',
        ),
      ).rejects.toThrow('Tiedostoresurssille tarvitaan ladattu tiedosto');
    });

    it('throws a translated error when a link resource is missing its url', async () => {
      await expect(
        service.createAdminResource(
          {
            title: 'Policy',
            type: ResourceType.LINK,
            assignedUserId: 7,
          },
          1,
          'fi',
        ),
      ).rejects.toThrow('Linkkiresurssille tarvitaan URL-osoite');
    });
  });

  describe('deleteAdminResource', () => {
    it('removes an admin resource and deletes related notifications', async () => {
      const resource = createMockResource();
      resourceRepository.findOne.mockResolvedValue(resource);
      resourceRepository.remove.mockResolvedValue(resource);

      await service.deleteAdminResource('resource-1');

      expect(resourceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'resource-1' },
      });
      expect(resourceRepository.remove).toHaveBeenCalledWith(resource);
      expect(
        notificationsService.deleteResourceNotifications,
      ).toHaveBeenCalledWith('resource-1');
    });

    it('throws a translated error when admin resource does not exist', async () => {
      resourceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteAdminResource('missing-resource', 'fi'),
      ).rejects.toThrow('Resurssia ei loytynyt');
    });
  });

  describe('listMyResources', () => {
    it('loads only the current user resources with relation data', async () => {
      const resource = createMockResource(
        {
          source: ResourceSource.USER,
          createdByUserId: 7,
          linkUrl: 'https://example.com/checklist',
          type: ResourceType.LINK,
          fileUrl: null,
          filename: null,
          mimeType: null,
        },
        createMockUser(),
      );
      resourceRepository.find.mockResolvedValue([resource]);

      const result = await service.listMyResources(7);

      expect(resourceRepository.find).toHaveBeenCalledWith({
        where: { assignedUserId: 7 },
        relations: ['assignedUser'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([
        expect.objectContaining({
          source: ResourceSource.USER,
        }),
      ]);
      expect(result[0].assignedUser.email).toBe('user@example.com');
    });
  });

  describe('createMyResource', () => {
    it('creates a user resource assigned to the current user', async () => {
      const dto: CreateMyResourceDto = {
        title: '  My checklist  ',
        description: '  ',
        type: ResourceType.LINK,
        linkUrl: 'https://example.com/checklist',
      };
      const user = createMockUser();
      const createdResource = createMockResource(
        {
          title: 'My checklist',
          description: null,
          type: ResourceType.LINK,
          source: ResourceSource.USER,
          linkUrl: dto.linkUrl,
          fileUrl: null,
          filename: null,
          mimeType: null,
          createdByUserId: 7,
        },
        user,
      );

      userRepository.findOne.mockResolvedValue(user);
      resourceRepository.create.mockReturnValue(createdResource);
      resourceRepository.save.mockResolvedValue(createdResource);

      const result = await service.createMyResource(dto, 7);

      expect(resourceRepository.create).toHaveBeenCalledWith({
        title: 'My checklist',
        description: null,
        type: ResourceType.LINK,
        fileUrl: null,
        filename: null,
        mimeType: null,
        linkUrl: 'https://example.com/checklist',
        source: ResourceSource.USER,
        assignedUserId: 7,
        createdByUserId: 7,
      });
      expect(notificationsService.notifyResourceShared).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          source: ResourceSource.USER,
          createdByUserId: 7,
        }),
      );
    });

    it('throws when current user cannot be found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createMyResource(
          {
            title: 'My document',
            type: ResourceType.LINK,
            linkUrl: 'https://example.com',
          },
          7,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(resourceRepository.create).not.toHaveBeenCalled();
    });

    it('rejects a file resource without an uploaded file', async () => {
      await expect(
        service.createMyResource(
          {
            title: 'My document',
            type: ResourceType.FILE,
          },
          7,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteMyResource', () => {
    it('allows a user to delete their own uploaded resource', async () => {
      const resource = createMockResource({
        source: ResourceSource.USER,
        createdByUserId: 7,
        assignedUserId: 7,
      });
      resourceRepository.findOne.mockResolvedValue(resource);
      resourceRepository.remove.mockResolvedValue(resource);

      await service.deleteMyResource('resource-1', 7);

      expect(resourceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'resource-1', assignedUserId: 7 },
      });
      expect(resourceRepository.remove).toHaveBeenCalledWith(resource);
      expect(
        notificationsService.deleteResourceNotifications,
      ).not.toHaveBeenCalled();
    });

    it('rejects deleting an admin-provided resource from my space', async () => {
      resourceRepository.findOne.mockResolvedValue(
        createMockResource({
          source: ResourceSource.ADMIN,
          createdByUserId: 1,
          assignedUserId: 7,
        }),
      );

      await expect(service.deleteMyResource('resource-1', 7)).rejects.toThrow(
        BadRequestException,
      );

      expect(resourceRepository.remove).not.toHaveBeenCalled();
    });

    it('rejects deleting a user resource uploaded by someone else', async () => {
      resourceRepository.findOne.mockResolvedValue(
        createMockResource({
          source: ResourceSource.USER,
          createdByUserId: 12,
          assignedUserId: 7,
        }),
      );

      await expect(service.deleteMyResource('resource-1', 7)).rejects.toThrow(
        'You can only delete your own uploaded resources',
      );

      expect(resourceRepository.remove).not.toHaveBeenCalled();
    });

    it('throws a translated error when the resource is missing from my space', async () => {
      resourceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteMyResource('missing-resource', 7, 'fi'),
      ).rejects.toThrow('Resurssia ei loytynyt');
    });
  });

  describe('getResourceDownload', () => {
    it('allows the assigned user to download their private upload', async () => {
      const cleanupFixture = createResourceFixtureFile('personal-notes.pdf');
      resourceRepository.findOne.mockResolvedValue(
        createMockResource({
          assignedUserId: 7,
          createdByUserId: 7,
          source: ResourceSource.USER,
          filename: 'personal-notes.pdf',
          mimeType: 'application/pdf',
        }),
      );

      const result = await service.getResourceDownload('resource-1', {
        id: 7,
        role: UserRole.USER,
      });

      expect(resourceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'resource-1' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          filename: 'personal-notes.pdf',
          mimeType: 'application/pdf',
        }),
      );

      cleanupFixture();
    });

    it('allows admins to download resources sent from the admin space', async () => {
      const cleanupFixture = createResourceFixtureFile('admin-guide.pdf');
      resourceRepository.findOne.mockResolvedValue(
        createMockResource({
          assignedUserId: 7,
          createdByUserId: 1,
          source: ResourceSource.ADMIN,
          filename: 'admin-guide.pdf',
        }),
      );

      await expect(
        service.getResourceDownload('resource-1', {
          id: 1,
          role: UserRole.ADMIN,
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          filename: 'admin-guide.pdf',
        }),
      );

      cleanupFixture();
    });

    it('rejects admins trying to download a user private upload', async () => {
      resourceRepository.findOne.mockResolvedValue(
        createMockResource({
          assignedUserId: 7,
          createdByUserId: 7,
          source: ResourceSource.USER,
        }),
      );

      await expect(
        service.getResourceDownload('resource-1', {
          id: 1,
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects missing files before returning a download path', async () => {
      const missingFilePath = join(
        process.cwd(),
        'uploads',
        'resources',
        'missing-resource-test-file.pdf',
      );

      fs.rmSync(missingFilePath, { force: true });
      resourceRepository.findOne.mockResolvedValue(
        createMockResource({
          filename: 'missing-resource-test-file.pdf',
        }),
      );

      await expect(
        service.getResourceDownload('resource-1', {
          id: 7,
          role: UserRole.USER,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
