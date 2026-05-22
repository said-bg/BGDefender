import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Repository } from 'typeorm';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import sharp from 'sharp';
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
import {
  CertificateSignersService,
} from '../../certificate-signers/services/certificate-signers.service';
import { CertificateSignerRole } from '../../entities/certificate-signer.entity';

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
  director: CertificateSignerDisplay | null;
  programDirector: CertificateSignerDisplay | null;
  createdAt: Date;
  updatedAt: Date;
};

type CertificateSignerDisplay = {
  role: CertificateSignerRole;
  fullName: string | null;
  title: string | null;
  signatureData: string | null;
};

type CertificatePdfLanguage = 'en' | 'fi';

const CERTIFICATE_PDF_COPY: Record<
  CertificatePdfLanguage,
  {
    institutionLocation: string;
    certificateHeading: string;
    certificateLead: string;
    certificateSubLead: string;
    issuedDateLabel: string;
    certificateCodeLabel: string;
    issuerLabel: string;
    programLabel: string;
    brandNote: string;
    learnerFallback: string;
  }
> = {
  en: {
    institutionLocation: 'Cybersecurity Training Platform',
    certificateHeading: 'Certificate of Completion',
    certificateLead: 'This certifies that',
    certificateSubLead: 'has successfully completed the course',
    issuedDateLabel: 'Issued on',
    certificateCodeLabel: 'Certificate ID',
    issuerLabel: 'Director',
    programLabel: 'Program Director',
    brandNote: 'Issued by BG Defender Academy',
    learnerFallback: 'Learner',
  },
  fi: {
    institutionLocation: 'Kyberturvallisuuden koulutusalusta',
    certificateHeading: 'Suoritustodistus',
    certificateLead: 'Täten todistetaan, että',
    certificateSubLead: 'on suorittanut onnistuneesti kurssin',
    issuedDateLabel: 'Myönnetty',
    certificateCodeLabel: 'Todistuksen tunnus',
    issuerLabel: 'Johtaja',
    programLabel: 'Koulutusohjelman johtaja',
    brandNote: 'Myöntänyt BG Defender Academy',
    learnerFallback: 'Oppija',
  },
};

const DEFAULT_DIRECTOR_TITLES = new Set(['Director', 'Johtaja']);
const DEFAULT_PROGRAM_TITLES = new Set([
  'Program Director',
  'Program director',
  'Koulutusohjelman johtaja',
]);

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
    private readonly certificateSignersService: CertificateSignersService,
  ) {}

  async syncCourseCertificate(
    userId: number,
    courseId: string,
  ): Promise<CertificateCourseState | null> {
    const [user, course, finalTest] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['programDirector'],
      }),
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
      const signerSnapshot = await this.buildSignerSnapshot(course);
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
        directorSnapshotFullName: signerSnapshot.director?.fullName ?? null,
        directorSnapshotTitle: signerSnapshot.director?.title ?? null,
        directorSnapshotSignatureData:
          signerSnapshot.director?.signatureData ?? null,
        programDirectorSnapshotFullName:
          signerSnapshot.programDirector?.fullName ?? null,
        programDirectorSnapshotTitle:
          signerSnapshot.programDirector?.title ?? null,
        programDirectorSnapshotSignatureData:
          signerSnapshot.programDirector?.signatureData ?? null,
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
      !existingCertificate.directorSnapshotFullName &&
      !existingCertificate.directorSnapshotTitle &&
      !existingCertificate.directorSnapshotSignatureData &&
      !existingCertificate.programDirectorSnapshotFullName &&
      !existingCertificate.programDirectorSnapshotTitle &&
      !existingCertificate.programDirectorSnapshotSignatureData
    ) {
      const signerSnapshot = await this.buildSignerSnapshot(course);
      existingCertificate.directorSnapshotFullName =
        signerSnapshot.director?.fullName ?? null;
      existingCertificate.directorSnapshotTitle =
        signerSnapshot.director?.title ?? null;
      existingCertificate.directorSnapshotSignatureData =
        signerSnapshot.director?.signatureData ?? null;
      existingCertificate.programDirectorSnapshotFullName =
        signerSnapshot.programDirector?.fullName ?? null;
      existingCertificate.programDirectorSnapshotTitle =
        signerSnapshot.programDirector?.title ?? null;
      existingCertificate.programDirectorSnapshotSignatureData =
        signerSnapshot.programDirector?.signatureData ?? null;
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

    const courses = await this.courseRepository.find({
      where: pendingCertificates.map((certificate) => ({
        id: certificate.courseId,
      })),
      relations: ['programDirector'],
    });
    const courseById = new Map(courses.map((course) => [course.id, course]));

    for (const certificate of pendingCertificates) {
      certificate.status = CertificateStatus.ISSUED;
      certificate.firstNameSnapshot = user.firstName?.trim() ?? null;
      certificate.lastNameSnapshot = user.lastName?.trim() ?? null;
      certificate.issuedAt = new Date();

      if (
        !certificate.directorSnapshotFullName &&
        !certificate.directorSnapshotTitle &&
        !certificate.directorSnapshotSignatureData &&
        !certificate.programDirectorSnapshotFullName &&
        !certificate.programDirectorSnapshotTitle &&
        !certificate.programDirectorSnapshotSignatureData
      ) {
        const course = courseById.get(certificate.courseId);

        if (course) {
          const signerSnapshot = await this.buildSignerSnapshot(course);
          certificate.directorSnapshotFullName =
            signerSnapshot.director?.fullName ?? null;
          certificate.directorSnapshotTitle =
            signerSnapshot.director?.title ?? null;
          certificate.directorSnapshotSignatureData =
            signerSnapshot.director?.signatureData ?? null;
          certificate.programDirectorSnapshotFullName =
            signerSnapshot.programDirector?.fullName ?? null;
          certificate.programDirectorSnapshotTitle =
            signerSnapshot.programDirector?.title ?? null;
          certificate.programDirectorSnapshotSignatureData =
            signerSnapshot.programDirector?.signatureData ?? null;
        }
      }
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

    const signers = await this.loadCertificateSignerContext(certificates);

    return certificates.map((certificate) =>
      this.toListItem(
        certificate,
        signers.director,
        signers.programDirectorByCourseId.get(certificate.courseId) ?? null,
      ),
    );
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

    const signers = await this.loadCertificateSignerContext([certificate]);

    return this.toListItem(
      certificate,
      signers.director,
      signers.programDirectorByCourseId.get(certificate.courseId) ?? null,
    );
  }

  async getMyCertificatePdf(
    userId: number,
    certificateId: string,
    language?: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const certificate = await this.getMyCertificate(userId, certificateId);

    if (certificate.status !== 'issued') {
      throw new NotFoundException('Certificate PDF is only available once issued');
    }

    const normalizedLanguage: CertificatePdfLanguage =
      language?.toLowerCase().startsWith('fi') ? 'fi' : 'en';
    const pdfBytes = await this.renderCertificatePdf(
      certificate,
      normalizedLanguage,
    );

    return {
      buffer: Buffer.from(pdfBytes),
      filename: `${certificate.certificateCode}.pdf`,
    };
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

  private toListItem(
    certificate: Certificate,
    director: CertificateSignerDisplay | null,
    programDirector: CertificateSignerDisplay | null,
  ): CertificateListItem {
    const snappedDirector = this.getSnapshotSigner(
      certificate,
      CertificateSignerRole.DIRECTOR,
    );
    const snappedProgramDirector = this.getSnapshotSigner(
      certificate,
      CertificateSignerRole.PROGRAM_DIRECTOR,
    );

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
      director: snappedDirector ?? director,
      programDirector: snappedProgramDirector ?? programDirector,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
    };
  }

  private async loadCertificateSignerContext(certificates: Certificate[]) {
    const certificatesNeedingProgramDirectorFallback = certificates.filter(
      (certificate) =>
        !this.getSnapshotSigner(certificate, CertificateSignerRole.PROGRAM_DIRECTOR),
    );
    const courseIds = [
      ...new Set(
        certificatesNeedingProgramDirectorFallback.map(
          (certificate) => certificate.courseId,
        ),
      ),
    ];
    const [director, courses] = await Promise.all([
      this.certificateSignersService.getActiveDirectorSummary(),
      courseIds.length > 0
        ? this.courseRepository.find({
            where: courseIds.map((id) => ({ id })),
            relations: ['programDirector'],
          })
        : [],
    ]);

    return {
      director: director
        ? {
            role: CertificateSignerRole.DIRECTOR,
            fullName: director.fullName,
            title: director.title,
            signatureData: director.signatureData,
          }
        : null,
      programDirectorByCourseId: new Map<string, CertificateSignerDisplay | null>(
        courses.map(
          (course) =>
            [
              course.id,
              course.programDirector
                ? {
                    role: course.programDirector.role,
                    fullName: course.programDirector.fullName,
                    title: course.programDirector.title,
                    signatureData: course.programDirector.signatureData,
                  }
                : null,
            ] as const,
        ),
      ),
    };
  }

  private async buildSignerSnapshot(course: Course): Promise<{
    director: CertificateSignerDisplay | null;
    programDirector: CertificateSignerDisplay | null;
  }> {
    const director = await this.certificateSignersService.getActiveDirectorSummary();

    return {
      director: director
        ? {
            role: CertificateSignerRole.DIRECTOR,
            fullName: director.fullName,
            title: director.title,
            signatureData: director.signatureData,
          }
        : null,
      programDirector: course.programDirector
        ? {
            role: CertificateSignerRole.PROGRAM_DIRECTOR,
            fullName: course.programDirector.fullName,
            title: course.programDirector.title,
            signatureData: course.programDirector.signatureData,
          }
        : null,
    };
  }

  private getSnapshotSigner(
    certificate: Certificate,
    role: CertificateSignerRole,
  ): CertificateSignerDisplay | null {
    if (role === CertificateSignerRole.DIRECTOR) {
      if (
        !certificate.directorSnapshotFullName &&
        !certificate.directorSnapshotTitle &&
        !certificate.directorSnapshotSignatureData
      ) {
        return null;
      }

      return {
        role,
        fullName: certificate.directorSnapshotFullName,
        title: certificate.directorSnapshotTitle,
        signatureData: certificate.directorSnapshotSignatureData,
      };
    }

    if (
      !certificate.programDirectorSnapshotFullName &&
      !certificate.programDirectorSnapshotTitle &&
      !certificate.programDirectorSnapshotSignatureData
    ) {
      return null;
    }

    return {
      role,
      fullName: certificate.programDirectorSnapshotFullName,
      title: certificate.programDirectorSnapshotTitle,
      signatureData: certificate.programDirectorSnapshotSignatureData,
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

  private async renderCertificatePdf(
    certificate: CertificateListItem,
    language: CertificatePdfLanguage,
  ): Promise<Uint8Array> {
    const copy = CERTIFICATE_PDF_COPY[language];
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([842, 595]);
    const [fontRegular, fontBold] = await Promise.all([
      pdf.embedFont(StandardFonts.Helvetica),
      pdf.embedFont(StandardFonts.HelveticaBold),
    ]);

    page.drawRectangle({
      x: 0,
      y: 0,
      width: 842,
      height: 595,
      color: rgb(0.965, 0.973, 0.984),
    });

    page.drawRectangle({
      x: 18,
      y: 18,
      width: 806,
      height: 559,
      color: rgb(0.988, 0.992, 0.998),
      borderColor: rgb(0.84, 0.87, 0.92),
      borderWidth: 1,
    });

    await this.drawCertificateWatermark(pdf, page);

    page.drawText('BG Defender Academy', {
      x: 55,
      y: 535,
      size: 18,
      font: fontBold,
      color: rgb(0.11, 0.18, 0.31),
    });
    page.drawText(copy.institutionLocation, {
      x: 55,
      y: 514,
      size: 10.5,
      font: fontRegular,
      color: rgb(0.39, 0.46, 0.58),
    });

    await this.drawCertificateLogo(pdf, page);

    const heading = copy.certificateHeading;
    page.drawText(heading, {
      x: this.centerText(page, heading, fontBold, 28),
      y: 438,
      size: 28,
      font: fontBold,
      color: rgb(0.18, 0.26, 0.41),
    });

    page.drawText(copy.certificateLead, {
      x: this.centerText(page, copy.certificateLead, fontRegular, 12),
      y: 388,
      size: 12,
      font: fontRegular,
      color: rgb(0.39, 0.46, 0.58),
    });

    const learnerName = this.getCertificateFullNameForPdf(certificate, copy);
    page.drawText(learnerName, {
      x: this.centerText(page, learnerName, fontBold, 26),
      y: 358,
      size: 26,
      font: fontBold,
      color: rgb(0.11, 0.18, 0.31),
    });

    page.drawText(copy.certificateSubLead, {
      x: this.centerText(page, copy.certificateSubLead, fontRegular, 12),
      y: 328,
      size: 12,
      font: fontRegular,
      color: rgb(0.39, 0.46, 0.58),
    });

    const courseTitle =
      language === 'fi'
        ? certificate.courseTitleFi || certificate.courseTitleEn
        : certificate.courseTitleEn || certificate.courseTitleFi;
    page.drawText(courseTitle, {
      x: this.centerText(page, courseTitle, fontBold, 22),
      y: 290,
      size: 22,
      font: fontBold,
      color: rgb(0.11, 0.18, 0.31),
    });

    this.drawMetaCard(page, {
      x: 82,
      y: 146,
      width: 296,
      height: 74,
      label: copy.issuedDateLabel,
      value: this.formatIssuedDateForPdf(certificate.issuedAt, language),
      fontRegular,
      fontBold,
    });

    this.drawMetaCard(page, {
      x: 464,
      y: 146,
      width: 296,
      height: 74,
      label: copy.certificateCodeLabel,
      value: certificate.certificateCode,
      fontRegular,
      fontBold,
    });

    await this.drawSignatureBlock(pdf, page, {
      signer: certificate.director ?? null,
      fallbackLabel: copy.issuerLabel,
      x: 140,
      y: 68,
      fontRegular,
      fontBold,
      language,
    });

    await this.drawSignatureBlock(pdf, page, {
      signer: certificate.programDirector ?? null,
      fallbackLabel: copy.programLabel,
      x: 534,
      y: 68,
      fontRegular,
      fontBold,
      language,
    });

    page.drawText(copy.brandNote, {
      x: this.centerText(page, copy.brandNote, fontBold, 11),
      y: 34,
      size: 11,
      font: fontBold,
      color: rgb(0.39, 0.46, 0.58),
    });

    return await pdf.save();
  }

  private async drawCertificateLogo(pdf: PDFDocument, page: any) {
    try {
      const logoPath = path.resolve(
        __dirname,
        '../../../../frontend/public/assets/images/bgdefender.jpeg',
      );
      const logoBytes = await readFile(logoPath);
      const logoImage = await pdf.embedJpg(logoBytes);
      page.drawImage(logoImage, {
        x: 744,
        y: 502,
        width: 54,
        height: 54,
      });
    } catch {
      page.drawRectangle({
        x: 744,
        y: 502,
        width: 54,
        height: 54,
        color: rgb(0.97, 0.65, 0.08),
      });
    }
  }

  private async drawCertificateWatermark(pdf: PDFDocument, page: any) {
    return;
  }

  private drawMetaCard(
    page: any,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
      value: string;
      fontRegular: any;
      fontBold: any;
    },
  ) {
    page.drawRectangle({
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      color: rgb(0.998, 0.999, 1),
      borderColor: rgb(0.82, 0.86, 0.92),
      borderWidth: 1,
    });

    page.drawRectangle({
      x: options.x + 0.75,
      y: options.y + 0.75,
      width: options.width - 1.5,
      height: options.height - 1.5,
      color: rgb(1, 1, 1),
      opacity: 0.88,
    });

    page.drawText(options.label, {
      x: options.x + 16,
      y: options.y + options.height - 24,
      size: 10.5,
      font: options.fontRegular,
      color: rgb(0.48, 0.53, 0.63),
    });

    page.drawText(options.value, {
      x: options.x + 16,
      y: options.y + 19,
      size: 13,
      font: options.fontBold,
      color: rgb(0.11, 0.18, 0.31),
    });
  }

  private async drawSignatureBlock(
    pdf: PDFDocument,
    page: any,
    options: {
      signer: CertificateSignerDisplay | null;
      fallbackLabel: string;
      x: number;
      y: number;
      fontRegular: any;
      fontBold: any;
      language: CertificatePdfLanguage;
    },
  ) {
    const signatureBoxWidth = 112;
    const signatureBoxHeight = 28;
    const lineY = options.y + 28;

    if (options.signer?.signatureData) {
      try {
        const signatureBytes = this.decodeDataUrl(options.signer.signatureData);
        const normalizedSignatureBytes = await this.normalizeSignatureForPdf(
          signatureBytes,
        );
        const signatureImage = await pdf.embedPng(normalizedSignatureBytes);
        const aspectRatio = signatureImage.width / signatureImage.height;
        let drawWidth = signatureBoxWidth;
        let drawHeight = drawWidth / aspectRatio;

        if (drawHeight > signatureBoxHeight) {
          drawHeight = signatureBoxHeight;
          drawWidth = drawHeight * aspectRatio;
        }

        page.drawImage(signatureImage, {
          x: options.x + (signatureBoxWidth - drawWidth) / 2,
          y: lineY + 6,
          width: drawWidth,
          height: drawHeight,
        });
      } catch {
        // Ignore invalid signature data and fall back to an empty area.
      }
    }

    page.drawLine({
      start: { x: options.x - 6, y: lineY },
      end: { x: options.x + 146, y: lineY },
      thickness: 1,
      color: rgb(0.72, 0.77, 0.85),
    });

    const signerName = options.signer?.fullName?.trim();
    if (signerName) {
      page.drawText(signerName, {
        x: options.x + 70 - options.fontBold.widthOfTextAtSize(signerName, 11) / 2,
        y: options.y + 12,
        size: 11,
        font: options.fontBold,
        color: rgb(0.11, 0.18, 0.31),
      });
    }

    const label = this.resolveSignerLabelForPdf(
      options.signer,
      options.fallbackLabel,
      options.language,
    );
    page.drawText(label, {
      x: options.x + 70 - options.fontRegular.widthOfTextAtSize(label, 10) / 2,
      y: options.y - 2,
      size: 10,
      font: options.fontRegular,
      color: rgb(0.39, 0.46, 0.58),
    });
  }

  private async normalizeSignatureForPdf(signatureBytes: Uint8Array) {
    return await sharp(signatureBytes)
      .trim()
      .png()
      .toBuffer();
  }

  private resolveSignerLabelForPdf(
    signer: CertificateSignerDisplay | null,
    fallbackLabel: string,
    language: CertificatePdfLanguage,
  ) {
    const title = signer?.title?.trim();

    if (!title) {
      return fallbackLabel;
    }

    if (
      signer?.role === CertificateSignerRole.DIRECTOR &&
      DEFAULT_DIRECTOR_TITLES.has(title)
    ) {
      return CERTIFICATE_PDF_COPY[language].issuerLabel;
    }

    if (
      signer?.role === CertificateSignerRole.PROGRAM_DIRECTOR &&
      DEFAULT_PROGRAM_TITLES.has(title)
    ) {
      return CERTIFICATE_PDF_COPY[language].programLabel;
    }

    return title;
  }

  private getCertificateFullNameForPdf(
    certificate: CertificateListItem,
    copy: (typeof CERTIFICATE_PDF_COPY)[CertificatePdfLanguage],
  ) {
    return (
      [certificate.firstName, certificate.lastName].filter(Boolean).join(' ').trim() ||
      copy.learnerFallback
    );
  }

  private formatIssuedDateForPdf(
    issuedAt: Date | null,
    language: CertificatePdfLanguage,
  ) {
    if (!issuedAt) {
      return '-';
    }

    return new Intl.DateTimeFormat(language === 'fi' ? 'fi-FI' : 'en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(issuedAt);
  }

  private decodeDataUrl(dataUrl: string) {
    const [, base64 = ''] = dataUrl.split(',');
    return Buffer.from(base64, 'base64');
  }

  private centerText(
    page: any,
    value: string,
    font: any,
    size: number,
  ) {
    const width = font.widthOfTextAtSize(value, size);
    return (page.getWidth() - width) / 2;
  }
}
