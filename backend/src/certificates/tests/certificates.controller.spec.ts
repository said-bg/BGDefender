import { Test, TestingModule } from '@nestjs/testing';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { CertificatesController } from '../controllers/certificates.controller';
import { CertificatesService } from '../services/certificates.service';

describe('CertificatesController', () => {
  let controller: CertificatesController;

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

  const certificatesService = {
    listMyCertificates: jest.fn(),
    getMyCertificate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificatesController],
      providers: [
        {
          provide: CertificatesService,
          useValue: certificatesService,
        },
      ],
    }).compile();

    controller = module.get<CertificatesController>(CertificatesController);
  });

  it('delegates certificate listing for the current user', async () => {
    certificatesService.listMyCertificates.mockResolvedValue([]);

    await controller.listMyCertificates(currentUser);

    expect(certificatesService.listMyCertificates).toHaveBeenCalledWith(
      currentUser.id,
    );
  });

  it('delegates single certificate loading for the current user', async () => {
    certificatesService.getMyCertificate.mockResolvedValue({
      id: 'certificate-1',
    });

    await controller.getMyCertificate(currentUser, 'certificate-1');

    expect(certificatesService.getMyCertificate).toHaveBeenCalledWith(
      currentUser.id,
      'certificate-1',
    );
  });
});
