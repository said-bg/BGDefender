import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { ResourcesController } from '../controllers/resources.controller';
import { ResourcesService } from '../services/resources.service';

describe('ResourcesController', () => {
  let controller: ResourcesController;

  const currentUser: SafeUser = {
    id: 7,
    email: 'user@example.com',
    firstName: 'User',
    lastName: 'Example',
    occupation: null,
    role: 'USER',
    plan: 'FREE',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const resourcesService = {
    listAdminResources: jest.fn(),
    createAdminResource: jest.fn(),
    deleteAdminResource: jest.fn(),
    listMyResources: jest.fn(),
    createMyResource: jest.fn(),
    deleteMyResource: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [
        {
          provide: ResourcesService,
          useValue: resourcesService,
        },
      ],
    }).compile();

    controller = module.get<ResourcesController>(ResourcesController);
  });

  it('delegates admin resource listing', async () => {
    const query = { search: 'pdf', limit: 20, offset: 0 };
    resourcesService.listAdminResources.mockResolvedValue({
      data: [],
      count: 0,
    });

    await controller.listAdminResources(query);

    expect(resourcesService.listAdminResources).toHaveBeenCalledWith(query);
  });

  it('delegates admin resource creation with the resolved language', async () => {
    const dto = {
      title: 'Security guide',
      type: 'LINK',
      assignedUserId: 7,
      linkUrl: 'https://example.com',
    };
    resourcesService.createAdminResource.mockResolvedValue({
      id: 'resource-1',
    });

    await controller.createAdminResource(dto, currentUser, 'fi-FI,fi;q=0.9');

    expect(resourcesService.createAdminResource).toHaveBeenCalledWith(
      dto,
      currentUser.id,
      'fi',
    );
  });

  it('delegates admin resource deletion with the default language', async () => {
    resourcesService.deleteAdminResource.mockResolvedValue(undefined);

    await controller.deleteAdminResource('resource-1');

    expect(resourcesService.deleteAdminResource).toHaveBeenCalledWith(
      'resource-1',
      'en',
    );
  });

  it('delegates current-user resource listing', async () => {
    resourcesService.listMyResources.mockResolvedValue([]);

    await controller.listMyResources(currentUser);

    expect(resourcesService.listMyResources).toHaveBeenCalledWith(
      currentUser.id,
    );
  });

  it('delegates current-user resource creation with the resolved language', async () => {
    const dto = {
      title: 'Security guide',
      type: 'FILE',
      fileUrl: '/uploads/resources/file.pdf',
    };
    resourcesService.createMyResource.mockResolvedValue({ id: 'resource-1' });

    await controller.createMyResource(dto, currentUser, 'fi-FI');

    expect(resourcesService.createMyResource).toHaveBeenCalledWith(
      dto,
      currentUser.id,
      'fi',
    );
  });

  it('delegates current-user resource deletion', async () => {
    resourcesService.deleteMyResource.mockResolvedValue(undefined);

    await controller.deleteMyResource('resource-1', currentUser, 'fi-FI');

    expect(resourcesService.deleteMyResource).toHaveBeenCalledWith(
      'resource-1',
      currentUser.id,
      'fi',
    );
  });

  it('throws when no uploaded file is provided', () => {
    const request = {
      headers: {},
      protocol: 'http',
      get: jest.fn(),
    } as unknown as Request;

    expect(() => controller.uploadResource(undefined, request)).toThrow(
      BadRequestException,
    );
  });

  it('returns a translated error when no uploaded file is provided in finnish', () => {
    const request = {
      headers: { 'accept-language': 'fi-FI,fi;q=0.9' },
      protocol: 'http',
      get: jest.fn(),
    } as unknown as Request;

    expect(() => controller.uploadResource(undefined, request)).toThrow(
      'Resurssitiedosto vaaditaan',
    );
  });

  it('returns a public file payload for successful uploads', () => {
    const file = {
      path: 'C:\\workspace\\uploads\\resources\\security-guide.pdf',
      filename: 'security-guide.pdf',
      mimetype: 'application/pdf',
    };
    const request = {
      headers: {},
      protocol: 'https',
      get: jest.fn().mockReturnValue('bgdefender.local'),
    } as unknown as Request;

    expect(controller.uploadResource(file, request)).toEqual({
      url: 'https://bgdefender.local/uploads/resources/security-guide.pdf',
      filename: 'security-guide.pdf',
      mimeType: 'application/pdf',
    });
  });

  it('throws when the uploaded file cannot be converted to a public url', () => {
    const file = {
      path: 'C:\\workspace\\tmp\\security-guide.pdf',
      filename: 'security-guide.pdf',
      mimetype: 'application/pdf',
    };
    const request = {
      headers: {},
      protocol: 'https',
      get: jest.fn().mockReturnValue('bgdefender.local'),
    } as unknown as Request;

    expect(() => controller.uploadResource(file, request)).toThrow(
      'Failed to resolve uploaded file URL',
    );
  });

  it('throws a translated error when the upload host cannot be resolved', () => {
    const file = {
      path: 'C:\\workspace\\uploads\\resources\\security-guide.pdf',
      filename: 'security-guide.pdf',
      mimetype: 'application/pdf',
    };
    const request = {
      headers: { 'accept-language': 'fi-FI' },
      protocol: 'https',
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as Request;

    expect(() => controller.uploadResource(file, request)).toThrow(
      'Ladattua tiedostoa ei voitu muuntaa URL-osoitteeksi',
    );
  });
});
