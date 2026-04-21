import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Certificate,
  CertificateStatus,
} from '../../entities/certificate.entity';
import { Course } from '../../entities/course.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import { Quiz } from '../../entities/quiz.entity';
import { QuizScope } from '../../entities/quiz-scope.enum';
import { User, UserPlan, UserRole } from '../../entities/user.entity';
import { CertificatesService } from '../services/certificates.service';
import { NotificationsService } from '../../notifications/services/notifications.service';

type MockRepository = {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock<Promise<unknown>, [unknown]>;
};

const createMockRepository = <T extends object>(): MockRepository => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((value?: Partial<T>) => Object.assign({} as T, value)),
  save: jest.fn((value: T | T[]) => Promise.resolve(value)),
});

describe('CertificatesService', () => {
  let service: CertificatesService;
  let certificateRepository: MockRepository;
  let courseRepository: MockRepository;
  let quizRepository: MockRepository;
  let quizAttemptRepository: MockRepository;
  let userRepository: MockRepository;
  const notificationsService = {
    notifyCertificateAvailable: jest.fn(),
    notifyCompleteProfileForCertificate: jest.fn(),
  };

  const userWithProfile = Object.assign(new User(), {
    id: 12,
    email: 'user@example.com',
    firstName: 'Said',
    lastName: 'Ait',
    occupation: null,
    password: 'hashed',
    role: UserRole.USER,
    plan: UserPlan.FREE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const userWithoutProfile = Object.assign(new User(), {
    ...userWithProfile,
    firstName: null,
    lastName: null,
  });

  const course = Object.assign(new Course(), {
    id: 'course-1',
    titleEn: 'Understanding Online Risks',
    titleFi: 'Understanding Online Risks',
  });

  const finalTest = Object.assign(new Quiz(), {
    id: 'final-test-1',
    scope: QuizScope.COURSE_FINAL,
    courseId: 'course-1',
    isPublished: true,
  });

  const passedAttempt = Object.assign(new QuizAttempt(), {
    id: 'attempt-1',
    quizId: 'final-test-1',
    userId: 12,
    score: 80,
    passed: true,
    submittedAt: new Date('2026-04-09T10:00:00.000Z'),
  });

  const createCertificate = (
    overrides: Partial<Certificate> = {},
  ): Certificate =>
    Object.assign(new Certificate(), {
      id: 'certificate-1',
      userId: 12,
      courseId: 'course-1',
      status: CertificateStatus.PENDING_PROFILE,
      certificateCode: 'BGD-2026-ABC123',
      firstNameSnapshot: null,
      lastNameSnapshot: null,
      courseTitleEnSnapshot: 'Understanding Online Risks',
      courseTitleFiSnapshot: 'Understanding Online Risks',
      issuedAt: null,
      createdAt: new Date('2026-04-09T10:00:00.000Z'),
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
      ...overrides,
    });

  const getSavedCertificate = (): Certificate => {
    expect(certificateRepository.save).toHaveBeenCalledTimes(1);
    return certificateRepository.save.mock.calls[0][0] as Certificate;
  };

  beforeEach(async () => {
    certificateRepository = createMockRepository<Certificate>();
    courseRepository = createMockRepository<Course>();
    quizRepository = createMockRepository<Quiz>();
    quizAttemptRepository = createMockRepository<QuizAttempt>();
    userRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        {
          provide: getRepositoryToken(Certificate),
          useValue: certificateRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
        {
          provide: getRepositoryToken(Quiz),
          useValue: quizRepository,
        },
        {
          provide: getRepositoryToken(QuizAttempt),
          useValue: quizAttemptRepository,
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

    service = module.get<CertificatesService>(CertificatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates an issued certificate when the learner has a complete profile', async () => {
    userRepository.findOne.mockResolvedValue(userWithProfile);
    courseRepository.findOne.mockResolvedValue(course);
    quizRepository.findOne.mockResolvedValue(finalTest);
    quizAttemptRepository.findOne.mockResolvedValue(passedAttempt);
    certificateRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await service.syncCourseCertificate(12, 'course-1');

    expect(certificateRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: CertificateStatus.ISSUED,
        firstNameSnapshot: 'Said',
        lastNameSnapshot: 'Ait',
      }),
    );
    expect(result?.status).toBe('issued');
  });

  it('creates a pending certificate and notifies the learner to complete the profile', async () => {
    userRepository.findOne.mockResolvedValue(userWithoutProfile);
    courseRepository.findOne.mockResolvedValue(course);
    quizRepository.findOne.mockResolvedValue(finalTest);
    quizAttemptRepository.findOne.mockResolvedValue(passedAttempt);
    certificateRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await service.syncCourseCertificate(12, 'course-1');

    expect(certificateRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: CertificateStatus.PENDING_PROFILE,
        firstNameSnapshot: null,
        lastNameSnapshot: null,
      }),
    );
    expect(
      notificationsService.notifyCompleteProfileForCertificate,
    ).toHaveBeenCalledWith(12, 'course-1', course.titleEn, course.titleFi);
    expect(
      notificationsService.notifyCertificateAvailable,
    ).not.toHaveBeenCalled();
    expect(result?.status).toBe('pending_profile');
  });

  it('returns null when the learner cannot be found', async () => {
    userRepository.findOne.mockResolvedValue(null);
    courseRepository.findOne.mockResolvedValue(course);
    quizRepository.findOne.mockResolvedValue(finalTest);

    const result = await service.syncCourseCertificate(12, 'course-1');

    expect(result).toBeNull();
    expect(certificateRepository.save).not.toHaveBeenCalled();
  });

  it('returns the current certificate state when the final test has not been passed yet', async () => {
    userRepository.findOne.mockResolvedValue(userWithProfile);
    courseRepository.findOne.mockResolvedValue(course);
    quizRepository.findOne.mockResolvedValue(finalTest);
    quizAttemptRepository.findOne.mockResolvedValue(null);
    certificateRepository.findOne.mockResolvedValue(
      createCertificate({
        status: CertificateStatus.PENDING_PROFILE,
      }),
    );

    const result = await service.syncCourseCertificate(12, 'course-1');

    expect(result).toEqual({
      id: 'certificate-1',
      status: 'pending_profile',
      issuedAt: null,
    });
    expect(certificateRepository.save).not.toHaveBeenCalled();
  });

  it('promotes an existing pending certificate to issued once the profile is complete', async () => {
    userRepository.findOne.mockResolvedValue(userWithProfile);
    courseRepository.findOne.mockResolvedValue(course);
    quizRepository.findOne.mockResolvedValue(finalTest);
    quizAttemptRepository.findOne.mockResolvedValue(passedAttempt);
    certificateRepository.findOne.mockResolvedValue(
      createCertificate({
        status: CertificateStatus.PENDING_PROFILE,
      }),
    );

    const result = await service.syncCourseCertificate(12, 'course-1');
    const savedCertificate = getSavedCertificate();

    expect(savedCertificate.id).toBe('certificate-1');
    expect(savedCertificate.status).toBe(CertificateStatus.ISSUED);
    expect(savedCertificate.firstNameSnapshot).toBe('Said');
    expect(savedCertificate.lastNameSnapshot).toBe('Ait');
    expect(savedCertificate.issuedAt).toBeInstanceOf(Date);
    expect(
      notificationsService.notifyCertificateAvailable,
    ).toHaveBeenCalledWith(12, 'course-1', course.titleEn, course.titleFi);
    expect(result?.status).toBe('issued');
  });

  it('refreshes course title snapshots on an existing certificate when course titles change', async () => {
    const renamedCourse = Object.assign(new Course(), {
      ...course,
      titleEn: 'Updated English title',
      titleFi: 'Updated Finnish title',
    });

    userRepository.findOne.mockResolvedValue(userWithoutProfile);
    courseRepository.findOne.mockResolvedValue(renamedCourse);
    quizRepository.findOne.mockResolvedValue(finalTest);
    quizAttemptRepository.findOne.mockResolvedValue(passedAttempt);
    certificateRepository.findOne.mockResolvedValue(
      createCertificate({
        courseTitleEnSnapshot: 'Old title',
        courseTitleFiSnapshot: 'Vanha nimi',
      }),
    );

    const result = await service.syncCourseCertificate(12, 'course-1');

    expect(certificateRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        courseTitleEnSnapshot: 'Updated English title',
        courseTitleFiSnapshot: 'Updated Finnish title',
      }),
    );
    expect(result?.status).toBe('pending_profile');
  });

  it('returns the existing issued certificate without saving when nothing changed', async () => {
    const existingIssuedCertificate = createCertificate({
      status: CertificateStatus.ISSUED,
      firstNameSnapshot: 'Said',
      lastNameSnapshot: 'Ait',
      issuedAt: new Date('2026-04-09T12:00:00.000Z'),
    });

    userRepository.findOne.mockResolvedValue(userWithProfile);
    courseRepository.findOne.mockResolvedValue(course);
    quizRepository.findOne.mockResolvedValue(finalTest);
    quizAttemptRepository.findOne.mockResolvedValue(passedAttempt);
    certificateRepository.findOne.mockResolvedValue(existingIssuedCertificate);

    const result = await service.syncCourseCertificate(12, 'course-1');

    expect(certificateRepository.save).not.toHaveBeenCalled();
    expect(
      notificationsService.notifyCertificateAvailable,
    ).not.toHaveBeenCalled();
    expect(
      notificationsService.notifyCompleteProfileForCertificate,
    ).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: 'certificate-1',
      status: 'issued',
      issuedAt: new Date('2026-04-09T12:00:00.000Z'),
    });
  });

  it('promotes pending certificates after the learner completes the profile', async () => {
    userRepository.findOne.mockResolvedValue(userWithProfile);
    certificateRepository.find.mockResolvedValue([createCertificate()]);

    await service.syncPendingCertificatesForUser(12);

    expect(certificateRepository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          status: CertificateStatus.ISSUED,
          firstNameSnapshot: 'Said',
          lastNameSnapshot: 'Ait',
        }),
      ]),
    );
    expect(
      notificationsService.notifyCertificateAvailable,
    ).toHaveBeenCalledWith(
      12,
      'course-1',
      'Understanding Online Risks',
      'Understanding Online Risks',
    );
  });

  it('returns early when pending certificates cannot be issued yet', async () => {
    userRepository.findOne.mockResolvedValue(userWithoutProfile);

    await service.syncPendingCertificatesForUser(12);

    expect(certificateRepository.find).not.toHaveBeenCalled();
    expect(certificateRepository.save).not.toHaveBeenCalled();
  });

  it('returns early when there are no pending certificates to promote', async () => {
    userRepository.findOne.mockResolvedValue(userWithProfile);
    certificateRepository.find.mockResolvedValue([]);

    await service.syncPendingCertificatesForUser(12);

    expect(certificateRepository.save).not.toHaveBeenCalled();
    expect(
      notificationsService.notifyCertificateAvailable,
    ).not.toHaveBeenCalled();
  });

  it('returns the course certificate status when one exists', async () => {
    certificateRepository.findOne.mockResolvedValue(
      createCertificate({
        status: CertificateStatus.ISSUED,
        issuedAt: new Date('2026-04-09T12:00:00.000Z'),
      }),
    );

    const result = await service.getCourseCertificateStatus(12, 'course-1');

    expect(result).toEqual({
      id: 'certificate-1',
      status: 'issued',
      issuedAt: new Date('2026-04-09T12:00:00.000Z'),
    });
  });

  it('returns null when the course certificate does not exist', async () => {
    certificateRepository.findOne.mockResolvedValue(null);

    const result = await service.getCourseCertificateStatus(12, 'course-1');

    expect(result).toBeNull();
  });

  it('lists user certificates with frontend-friendly statuses', async () => {
    certificateRepository.find.mockResolvedValue([
      createCertificate({
        status: CertificateStatus.ISSUED,
        firstNameSnapshot: 'Said',
        lastNameSnapshot: 'Ait',
        issuedAt: new Date('2026-04-09T12:00:00.000Z'),
        updatedAt: new Date('2026-04-09T12:00:00.000Z'),
      }),
    ]);

    const result = await service.listMyCertificates(12);

    expect(result).toEqual([
      expect.objectContaining({
        id: 'certificate-1',
        status: 'issued',
        courseTitleEn: 'Understanding Online Risks',
      }),
    ]);
  });

  it('returns a single certificate owned by the current user', async () => {
    certificateRepository.findOne.mockResolvedValue(
      createCertificate({
        status: CertificateStatus.ISSUED,
        firstNameSnapshot: 'Said',
        lastNameSnapshot: 'Ait',
        issuedAt: new Date('2026-04-09T12:00:00.000Z'),
      }),
    );

    const result = await service.getMyCertificate(12, 'certificate-1');

    expect(certificateRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'certificate-1',
        userId: 12,
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'certificate-1',
        status: 'issued',
        firstName: 'Said',
        lastName: 'Ait',
      }),
    );
  });

  it('throws when the requested certificate does not exist for the user', async () => {
    certificateRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getMyCertificate(12, 'missing-certificate'),
    ).rejects.toThrow(NotFoundException);
  });

  it('retries certificate code generation when a collision happens', async () => {
    const mathRandomSpy = jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.123456789)
      .mockReturnValueOnce(0.123456789)
      .mockReturnValueOnce(0.987654321);

    userRepository.findOne.mockResolvedValue(userWithProfile);
    courseRepository.findOne.mockResolvedValue(course);
    quizRepository.findOne.mockResolvedValue(finalTest);
    quizAttemptRepository.findOne.mockResolvedValue(passedAttempt);
    certificateRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        createCertificate({ certificateCode: 'BGD-2026-4FZZZX' }),
      )
      .mockResolvedValueOnce(null);

    await service.syncCourseCertificate(12, 'course-1');
    const savedCertificate = getSavedCertificate();

    expect(savedCertificate.certificateCode).toMatch(/^BGD-\d{4}-[A-Z0-9]{6}$/);

    mathRandomSpy.mockRestore();
  });
});
