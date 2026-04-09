import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Resource,
  ResourceSource,
  ResourceType,
} from '../entities/resource.entity';
import { User, UserPlan, UserRole } from '../entities/user.entity';
import { ResourcesService } from './resources.service';

describe('ResourcesService', () => {
  let service: ResourcesService;

  const resourceRepository = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const userRepository = {
    findOne: jest.fn(),
  };

  const mockUser: User = {
    id: 7,
    email: 'user@example.com',
    firstName: 'User',
    lastName: 'Example',
    occupation: null,
    password: 'hashed',
    role: UserRole.USER,
    plan: UserPlan.FREE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  it('should create an admin resource assigned to a user', async () => {
    userRepository.findOne.mockResolvedValue(mockUser);
    resourceRepository.create.mockImplementation(
      (value: Partial<Resource>): Resource => value as Resource,
    );
    resourceRepository.save.mockImplementation(
      (value: Resource): Promise<Resource> =>
        Promise.resolve({
          id: 'resource-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...value,
        } as Resource),
    );

    const result = await service.createAdminResource(
      {
        title: 'Security policy',
        description: 'Latest PDF',
        type: ResourceType.FILE,
        fileUrl: 'http://localhost:3001/uploads/resources/policy.pdf',
        filename: 'policy.pdf',
        mimeType: 'application/pdf',
        assignedUserId: 7,
      },
      1,
    );

    expect(result.source).toBe(ResourceSource.ADMIN);
    expect(result.assignedUserId).toBe(7);
    expect(result.filename).toBe('policy.pdf');
  });

  it('should reject a file resource without an uploaded file', async () => {
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

  it('should list only my resources', async () => {
    resourceRepository.find.mockResolvedValue([
      {
        id: 'resource-1',
        title: 'My checklist',
        description: null,
        type: ResourceType.LINK,
        fileUrl: null,
        filename: null,
        mimeType: null,
        linkUrl: 'https://example.com/checklist',
        source: ResourceSource.USER,
        assignedUserId: 7,
        assignedUser: mockUser,
        createdByUserId: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.listMyResources(7);

    expect(result).toHaveLength(1);
    expect(result[0].assignedUser.email).toBe('user@example.com');
  });

  it('should allow a user to delete their own uploaded resource', async () => {
    resourceRepository.findOne.mockResolvedValue({
      id: 'resource-1',
      source: ResourceSource.USER,
      createdByUserId: 7,
      assignedUserId: 7,
    });

    await service.deleteMyResource('resource-1', 7);

    expect(resourceRepository.remove).toHaveBeenCalled();
  });

  it('should reject deleting an admin-provided resource from my space', async () => {
    resourceRepository.findOne.mockResolvedValue({
      id: 'resource-1',
      source: ResourceSource.ADMIN,
      createdByUserId: 1,
      assignedUserId: 7,
    });

    await expect(service.deleteMyResource('resource-1', 7)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when assigned user does not exist', async () => {
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
  });
});
