import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Certificate,
  CertificateStatus,
} from '../../entities/certificate.entity';
import { Course } from '../../entities/course.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import { Quiz } from '../../entities/quiz.entity';
import { QuizScope } from '../../entities/quiz-scope.enum';
import { User } from '../../entities/user.entity';
import { NotificationsService } from '../../notifications/services/notifications.service';

type CertificateCourseState = {
  id: string;
  status: 'pending_profile' | 'issued';
  issuedAt: Date | null;
};

type CertificateListItem = {
  id: string;
  courseId: string;
  certificateCode: string;
  status: 'pending_profile' | 'issued';
  firstName: string | null;
  lastName: string | null;
  courseTitleEn: string;
  courseTitleFi: string;
  issuedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async syncCourseCertificate(
    userId: number,
    courseId: string,
  ): Promise<CertificateCourseState | null> {
    const [user, course, finalTest] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.courseRepository.findOne({ where: { id: courseId } }),
      this.quizRepository.findOne({
        where: {
          scope: QuizScope.COURSE_FINAL,
          courseId,
          isPublished: true,
        },
      }),
    ]);

    if (!user || !course || !finalTest) {
      return null;
    }

    const passedAttempt = await this.quizAttemptRepository.findOne({
      where: {
        quizId: finalTest.id,
        userId,
        passed: true,
      },
      order: {
        score: 'DESC',
        submittedAt: 'ASC',
      },
    });

    if (!passedAttempt) {
      return this.getCourseCertificateStatus(userId, courseId);
    }

    const profileIsComplete = this.hasCompleteCertificateName(user);
    const existingCertificate = await this.certificateRepository.findOne({
      where: { userId, courseId },
    });

    if (!existingCertificate) {
      const certificate = this.certificateRepository.create({
        userId,
        courseId,
        certificateCode: await this.generateCertificateCode(),
        status: profileIsComplete
          ? CertificateStatus.ISSUED
          : CertificateStatus.PENDING_PROFILE,
        firstNameSnapshot: profileIsComplete
          ? (user.firstName?.trim() ?? null)
          : null,
        lastNameSnapshot: profileIsComplete
          ? (user.lastName?.trim() ?? null)
          : null,
        courseTitleEnSnapshot: course.titleEn,
        courseTitleFiSnapshot: course.titleFi,
        issuedAt: profileIsComplete ? new Date() : null,
      });

      const savedCertificate =
        await this.certificateRepository.save(certificate);
      if (savedCertificate.status === CertificateStatus.ISSUED) {
        await this.notificationsService.notifyCertificateAvailable(
          userId,
          courseId,
          course.titleEn,
          course.titleFi,
        );
      } else {
        await this.notificationsService.notifyCompleteProfileForCertificate(
          userId,
          courseId,
          course.titleEn,
          course.titleFi,
        );
      }

      return this.toCourseState(savedCertificate);
    }

    let shouldSave = false;

    if (
      existingCertificate.courseTitleEnSnapshot !== course.titleEn ||
      existingCertificate.courseTitleFiSnapshot !== course.titleFi
    ) {
      existingCertificate.courseTitleEnSnapshot = course.titleEn;
      existingCertificate.courseTitleFiSnapshot = course.titleFi;
      shouldSave = true;
    }

    if (
      profileIsComplete &&
      existingCertificate.status === CertificateStatus.PENDING_PROFILE
    ) {
      existingCertificate.status = CertificateStatus.ISSUED;
      existingCertificate.firstNameSnapshot = user.firstName?.trim() ?? null;
      existingCertificate.lastNameSnapshot = user.lastName?.trim() ?? null;
      existingCertificate.issuedAt = new Date();
      shouldSave = true;
    }

    if (shouldSave) {
      const savedCertificate =
        await this.certificateRepository.save(existingCertificate);
      if (savedCertificate.status === CertificateStatus.ISSUED) {
        await this.notificationsService.notifyCertificateAvailable(
          userId,
          courseId,
          course.titleEn,
          course.titleFi,
        );
      }

      return this.toCourseState(savedCertificate);
    }

    return this.toCourseState(existingCertificate);
  }

  async syncPendingCertificatesForUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !this.hasCompleteCertificateName(user)) {
      return;
    }

    const pendingCertificates = await this.certificateRepository.find({
      where: {
        userId,
        status: CertificateStatus.PENDING_PROFILE,
      },
    });

    if (pendingCertificates.length === 0) {
      return;
    }

    for (const certificate of pendingCertificates) {
      certificate.status = CertificateStatus.ISSUED;
      certificate.firstNameSnapshot = user.firstName?.trim() ?? null;
      certificate.lastNameSnapshot = user.lastName?.trim() ?? null;
      certificate.issuedAt = new Date();
    }

    await this.certificateRepository.save(pendingCertificates);

    for (const certificate of pendingCertificates) {
      await this.notificationsService.notifyCertificateAvailable(
        userId,
        certificate.courseId,
        certificate.courseTitleEnSnapshot,
        certificate.courseTitleFiSnapshot,
      );
    }
  }

  async getCourseCertificateStatus(
    userId: number,
    courseId: string,
  ): Promise<CertificateCourseState | null> {
    const certificate = await this.certificateRepository.findOne({
      where: { userId, courseId },
    });

    return certificate ? this.toCourseState(certificate) : null;
  }

  async listMyCertificates(userId: number): Promise<CertificateListItem[]> {
    const certificates = await this.certificateRepository.find({
      where: { userId },
      order: {
        issuedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    return certificates.map((certificate) => this.toListItem(certificate));
  }

  async getMyCertificate(
    userId: number,
    certificateId: string,
  ): Promise<CertificateListItem> {
    const certificate = await this.certificateRepository.findOne({
      where: {
        id: certificateId,
        userId,
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return this.toListItem(certificate);
  }

  private hasCompleteCertificateName(user: User) {
    return Boolean(user.firstName?.trim() && user.lastName?.trim());
  }

  private toCourseState(certificate: Certificate): CertificateCourseState {
    return {
      id: certificate.id,
      status:
        certificate.status === CertificateStatus.ISSUED
          ? 'issued'
          : 'pending_profile',
      issuedAt: certificate.issuedAt,
    };
  }

  private toListItem(certificate: Certificate): CertificateListItem {
    return {
      id: certificate.id,
      courseId: certificate.courseId,
      certificateCode: certificate.certificateCode,
      status:
        certificate.status === CertificateStatus.ISSUED
          ? 'issued'
          : 'pending_profile',
      firstName: certificate.firstNameSnapshot,
      lastName: certificate.lastNameSnapshot,
      courseTitleEn: certificate.courseTitleEnSnapshot,
      courseTitleFi: certificate.courseTitleFiSnapshot,
      issuedAt: certificate.issuedAt,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
    };
  }

  private async generateCertificateCode(): Promise<string> {
    while (true) {
      const randomSegment = Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase();
      const year = new Date().getFullYear();
      const code = `BGD-${year}-${randomSegment}`;

      const existingCertificate = await this.certificateRepository.findOne({
        where: { certificateCode: code },
      });

      if (!existingCertificate) {
        return code;
      }
    }
  }
}
