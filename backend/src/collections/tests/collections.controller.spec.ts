import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import * as uploadSecurityUtils from '../../uploads/upload-security.utils';
import { CollectionsController } from '../controllers/collections.controller';
import { CollectionsService } from '../services/collections.service';

describe('CollectionsController', () => {
  let controller: CollectionsController;

  const collectionsService = {
    listPublishedCollections: jest.fn(),
    listAdminCollections: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest
      .spyOn(uploadSecurityUtils, 'matchesDeclaredFileSignature')
      .mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionsController],
      providers: [
        {
          provide: CollectionsService,
          useValue: collectionsService,
        },
      ],
    }).compile();

    controller = module.get<CollectionsController>(CollectionsController);
  });

  it('delegates published collection listing', async () => {
    const publishedCollections = [{ id: 'collection-1' }];
    collectionsService.listPublishedCollections.mockResolvedValue(
      publishedCollections,
    );

    await expect(controller.listPublishedCollections()).resolves.toEqual(
      publishedCollections,
    );
    expect(collectionsService.listPublishedCollections).toHaveBeenCalled();
  });

  it('delegates admin collection listing', async () => {
    const adminCollections = [{ id: 'collection-1' }];
    collectionsService.listAdminCollections.mockResolvedValue(adminCollections);

    await expect(controller.listAdminCollections()).resolves.toEqual(
      adminCollections,
    );
    expect(collectionsService.listAdminCollections).toHaveBeenCalled();
  });

  it('delegates collection creation', async () => {
    const dto = {
      titleEn: 'Cyber basics',
      titleFi: 'Cyber basics',
      courseIds: ['course-1'],
    };
    const createdCollection = { id: 'collection-1' };
    collectionsService.create.mockResolvedValue(createdCollection);

    await expect(controller.create(dto)).resolves.toEqual(createdCollection);
    expect(collectionsService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates collection updates', async () => {
    const dto = {
      titleEn: 'Updated title',
    };
    const updatedCollection = { id: 'collection-1' };
    collectionsService.update.mockResolvedValue(updatedCollection);

    await expect(controller.update('collection-1', dto)).resolves.toEqual(
      updatedCollection,
    );
    expect(collectionsService.update).toHaveBeenCalledWith('collection-1', dto);
  });

  it('delegates collection deletion', async () => {
    collectionsService.delete.mockResolvedValue(undefined);

    await expect(controller.delete('collection-1')).resolves.toBeUndefined();
    expect(collectionsService.delete).toHaveBeenCalledWith('collection-1');
  });

  it('throws when no uploaded cover file is provided', () => {
    const request = {
      headers: {},
      protocol: 'http',
      get: jest.fn(),
    } as unknown as Request;

    expect(() => controller.uploadCollectionCover(undefined, request)).toThrow(
      BadRequestException,
    );
  });

  it('returns a translated error when no uploaded cover is provided in finnish', () => {
    const request = {
      headers: { 'accept-language': 'fi-FI,fi;q=0.9' },
      protocol: 'http',
      get: jest.fn(),
    } as unknown as Request;

    expect(() => controller.uploadCollectionCover(undefined, request)).toThrow(
      'Kokoelman kansikuvatiedosto vaaditaan',
    );
  });

  it('returns a public cover payload for successful uploads', () => {
    const file = {
      path: 'C:\\workspace\\uploads\\collection-covers\\cover-image.webp',
      filename: 'cover-image.webp',
    };
    const request = {
      headers: {},
      protocol: 'https',
      get: jest.fn().mockReturnValue('bgdefender.local'),
    } as unknown as Request;

    expect(controller.uploadCollectionCover(file, request)).toEqual({
      statusCode: HttpStatus.CREATED,
      url: 'https://bgdefender.local/uploads/collection-covers/cover-image.webp',
      filename: 'cover-image.webp',
    });
  });

  it('throws when the uploaded cover cannot be converted to a public url', () => {
    const file = {
      path: 'C:\\workspace\\tmp\\cover-image.webp',
      filename: 'cover-image.webp',
    };
    const request = {
      headers: {},
      protocol: 'https',
      get: jest.fn().mockReturnValue('bgdefender.local'),
    } as unknown as Request;

    expect(() => controller.uploadCollectionCover(file, request)).toThrow(
      'Failed to resolve uploaded file URL',
    );
  });

  it('throws a translated error when the upload host cannot be resolved', () => {
    const file = {
      path: 'C:\\workspace\\uploads\\collection-covers\\cover-image.webp',
      filename: 'cover-image.webp',
    };
    const request = {
      headers: { 'accept-language': 'fi-FI' },
      protocol: 'https',
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as Request;

    expect(() => controller.uploadCollectionCover(file, request)).toThrow(
      'Ladattua tiedostoa ei voitu muuntaa URL-osoitteeksi',
    );
  });
});
