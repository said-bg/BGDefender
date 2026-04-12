import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Certificate, CertificateStatus } from '../entities/certificate.entity';
import { Course } from '../entities/course.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizScope } from '../entities/quiz-scope.enum';
import { User, UserPlan, UserRole } from '../entities/user.entity';
import { CertificatesService } from './certificates.service';
import { NotificationsService } from '../notifications/notifications.service';

type MockRepository = {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
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

  it('creates a pending certificate when the learner profile is incomplete', async () => {
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
    expect(result?.status).toBe('pending_profile');
  });

  it('promotes pending certificates after the learner completes the profile', async () => {
    userRepository.findOne.mockResolvedValue(userWithProfile);
    certificateRepository.find.mockResolvedValue([
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ]);

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
  });

  it('lists user certificates with frontend-friendly statuses', async () => {
    certificateRepository.find.mockResolvedValue([
      Object.assign(new Certificate(), {
        id: 'certificate-1',
        userId: 12,
        courseId: 'course-1',
        status: CertificateStatus.ISSUED,
        certificateCode: 'BGD-2026-ABC123',
        firstNameSnapshot: 'Said',
        lastNameSnapshot: 'Ait',
        courseTitleEnSnapshot: 'Understanding Online Risks',
        courseTitleFiSnapshot: 'Understanding Online Risks',
        issuedAt: new Date('2026-04-09T12:00:00.000Z'),
        createdAt: new Date('2026-04-09T10:00:00.000Z'),
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
});
