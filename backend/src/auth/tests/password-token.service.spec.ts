import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

import { PasswordTokenService } from '../services/password-token.service';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';

type SaveTokenInput = {
  email: string;
  tokenHash: string;
  expiresAt: Date;
};

type FindTokenResult = {
  id: string;
  email: string;
  tokenHash: string;
  usedAt: Date | null;
  expiresAt: Date;
} | null;

type UpdateResult = {
  affected: number;
};

type MockQueryBuilder = {
  update: jest.MockedFunction<
    (entity: typeof PasswordResetToken) => MockQueryBuilder
  >;
  set: jest.MockedFunction<(values: { usedAt: Date }) => MockQueryBuilder>;
  where: jest.MockedFunction<
    (query: string, params: { email: string }) => MockQueryBuilder
  >;
  andWhere: jest.MockedFunction<(query: string) => MockQueryBuilder>;
  execute: jest.MockedFunction<() => Promise<unknown>>;
};

type MockRepository = {
  createQueryBuilder: jest.MockedFunction<() => MockQueryBuilder>;
  findOne: jest.MockedFunction<
    (options: { where: { tokenHash: string } }) => Promise<FindTokenResult>
  >;
  save: jest.MockedFunction<(data: SaveTokenInput) => Promise<unknown>>;
  update: jest.MockedFunction<
    (
      criteria: { id: string },
      partialEntity: { usedAt: Date },
    ) => Promise<UpdateResult>
  >;
};

describe('PasswordTokenService', () => {
  let service: PasswordTokenService;
  let repositoryMock: MockRepository;
  let queryBuilderMock: MockQueryBuilder;
  let savedTokenInput: SaveTokenInput | undefined;

  beforeEach(async () => {
    savedTokenInput = undefined;

    queryBuilderMock = {
      update: jest.fn(),
      set: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      execute: jest.fn(),
    };

    queryBuilderMock.update.mockReturnValue(queryBuilderMock);
    queryBuilderMock.set.mockReturnValue(queryBuilderMock);
    queryBuilderMock.where.mockReturnValue(queryBuilderMock);
    queryBuilderMock.andWhere.mockReturnValue(queryBuilderMock);
    queryBuilderMock.execute.mockResolvedValue({});

    repositoryMock = {
      createQueryBuilder: jest
        .fn<() => MockQueryBuilder>()
        .mockReturnValue(queryBuilderMock),
      findOne:
        jest.fn<
          (options: {
            where: { tokenHash: string };
          }) => Promise<FindTokenResult>
        >(),
      save: jest.fn((data: SaveTokenInput): Promise<unknown> => {
        savedTokenInput = data;
        return Promise.resolve({
          id: 'mock-id',
          ...data,
        });
      }),
      update:
        jest.fn<
          (
            criteria: { id: string },
            partialEntity: { usedAt: Date },
          ) => Promise<UpdateResult>
        >(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordTokenService,
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<PasswordTokenService>(PasswordTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createResetToken', () => {
    it('should create a new reset token with hash and expiration', async () => {
      const email = 'user@example.com';

      repositoryMock.save.mockImplementation(
        (data: SaveTokenInput): Promise<unknown> => {
          savedTokenInput = data;
          return Promise.resolve({
            id: 'token-id',
            email,
            tokenHash: 'hashed-token',
            expiresAt: new Date(),
          });
        },
      );

      const token = await service.createResetToken(email);

      expect(token).toBeTruthy();
      expect(token).toHaveLength(64);
      expect(repositoryMock.save).toHaveBeenCalled();

      expect(savedTokenInput).toBeDefined();

      if (!savedTokenInput) {
        throw new Error('savedTokenInput should be defined');
      }

      expect(savedTokenInput.tokenHash).not.toBe(token);
      expect(savedTokenInput.email).toBe(email);
      expect(savedTokenInput.expiresAt).toBeInstanceOf(Date);
    });

    it('should invalidate previous unused tokens for the email', async () => {
      const email = 'user@example.com';

      repositoryMock.save.mockImplementation(
        (): Promise<unknown> =>
          Promise.resolve({
            id: 'new-token-id',
            email,
            tokenHash: 'hashed-token',
            expiresAt: new Date(),
          }),
      );

      await service.createResetToken(email);

      expect(repositoryMock.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilderMock.update).toHaveBeenCalledWith(PasswordResetToken);

      expect(queryBuilderMock.set).toHaveBeenCalled();

      const setArg = queryBuilderMock.set.mock.calls[0]?.[0];

      if (!setArg) {
        throw new Error('setArg should be defined');
      }

      expect(setArg.usedAt).toBeInstanceOf(Date);

      expect(queryBuilderMock.where).toHaveBeenCalledWith('email = :email', {
        email,
      });
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith('usedAt IS NULL');
      expect(queryBuilderMock.execute).toHaveBeenCalled();
    });

    it('should set expiration to 1 hour from now', async () => {
      const email = 'user@example.com';

      repositoryMock.save.mockImplementation(
        (data: SaveTokenInput): Promise<unknown> => {
          savedTokenInput = data;
          return Promise.resolve({
            id: 'token-id',
            email,
            tokenHash: 'hashed-token',
            expiresAt: new Date(),
          });
        },
      );

      const beforeTime = new Date();
      beforeTime.setHours(beforeTime.getHours() + 1);

      await service.createResetToken(email);

      const afterTime = new Date();
      afterTime.setHours(afterTime.getHours() + 1);

      expect(savedTokenInput).toBeDefined();

      if (!savedTokenInput) {
        throw new Error('savedTokenInput should be defined');
      }

      expect(savedTokenInput.expiresAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(savedTokenInput.expiresAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime() + 1000,
      );
    });
  });

  describe('findTokenByPlainToken', () => {
    it('should return token id and email for valid token', async () => {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      repositoryMock.findOne.mockImplementation(
        (): Promise<FindTokenResult> =>
          Promise.resolve({
            id: 'token-id',
            email: 'user@example.com',
            tokenHash,
            usedAt: null,
            expiresAt: futureDate,
          }),
      );

      await expect(service.findTokenByPlainToken(plainToken)).resolves.toEqual({
        id: 'token-id',
        email: 'user@example.com',
      });
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { tokenHash },
      });
    });

    it('should throw BadRequestException if token not found', async () => {
      const plainToken = crypto.randomBytes(32).toString('hex');

      repositoryMock.findOne.mockImplementation(
        (): Promise<FindTokenResult> => Promise.resolve(null),
      );

      await expect(service.findTokenByPlainToken(plainToken)).rejects.toThrow(
        new BadRequestException('Invalid reset token'),
      );
    });

    it('should throw BadRequestException if token already used', async () => {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      repositoryMock.findOne.mockImplementation(
        (): Promise<FindTokenResult> =>
          Promise.resolve({
            id: 'token-id',
            email: 'user@example.com',
            tokenHash,
            usedAt: new Date(),
            expiresAt: futureDate,
          }),
      );

      await expect(service.findTokenByPlainToken(plainToken)).rejects.toThrow(
        new BadRequestException('This reset token has already been used'),
      );
    });

    it('should throw BadRequestException if token expired', async () => {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      repositoryMock.findOne.mockImplementation(
        (): Promise<FindTokenResult> =>
          Promise.resolve({
            id: 'token-id',
            email: 'user@example.com',
            tokenHash,
            usedAt: null,
            expiresAt: pastDate,
          }),
      );

      await expect(service.findTokenByPlainToken(plainToken)).rejects.toThrow(
        new BadRequestException('This reset token has expired'),
      );
    });
  });

  describe('markAsUsed', () => {
    it('should mark token as used by updating usedAt', async () => {
      const tokenId = 'token-id';

      repositoryMock.update.mockImplementation(
        (): Promise<UpdateResult> => Promise.resolve({ affected: 1 }),
      );

      await service.markAsUsed(tokenId);

      expect(repositoryMock.update).toHaveBeenCalled();

      const updateCall = repositoryMock.update.mock.calls[0];

      if (!updateCall) {
        throw new Error('updateCall should be defined');
      }

      const [criteriaArg, partialEntityArg] = updateCall;

      expect(criteriaArg).toEqual({ id: tokenId });
      expect(partialEntityArg.usedAt).toBeInstanceOf(Date);
    });
  });
});
