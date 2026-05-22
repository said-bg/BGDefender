import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CertificateSigner,
  CertificateSignerRole,
} from '../../entities/certificate-signer.entity';
import { Course } from '../../entities/course.entity';
import { UpdateSignerCourseAssignmentsDto } from '../dto/update-signer-course-assignments.dto';
import { UpsertCertificateSignerDto } from '../dto/upsert-certificate-signer.dto';

export type CertificateSignerAssignedCourseSummary = {
  id: string;
  titleEn: string;
  titleFi: string;
  status: Course['status'];
  level: Course['level'];
};

export type CertificateSignerSummary = {
  id: string;
  fullName: string;
  role: CertificateSignerRole;
  title: string;
  signatureData: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignedCourses: CertificateSignerAssignedCourseSummary[];
};

export type CertificateSignerOptions = {
  director: CertificateSignerSummary | null;
  programDirectors: CertificateSignerSummary[];
};

export type CertificateSignerCourseAssignmentCourse = {
  id: string;
  titleEn: string;
  titleFi: string;
  status: Course['status'];
  level: Course['level'];
  programDirectorId: string | null;
};

export type CertificateSignerCourseAssignments = {
  signerId: string;
  courseIds: string[];
  courses: CertificateSignerCourseAssignmentCourse[];
};

@Injectable()
export class CertificateSignersService {
  constructor(
    @InjectRepository(CertificateSigner)
    private readonly certificateSignerRepository: Repository<CertificateSigner>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async listAll(role?: CertificateSignerRole): Promise<CertificateSignerSummary[]> {
    const signers = await this.certificateSignerRepository.find({
      where: role ? { role } : undefined,
      relations: {
        managedCourses: true,
      },
      order: {
        role: 'ASC',
        isActive: 'DESC',
        updatedAt: 'DESC',
      },
    });

    return signers.map((signer) => this.toSummary(signer));
  }

  async getOptions(): Promise<CertificateSignerOptions> {
    const [director, programDirectors] = await Promise.all([
      this.getActiveDirector(),
      this.certificateSignerRepository.find({
        where: {
          role: CertificateSignerRole.PROGRAM_DIRECTOR,
          isActive: true,
        },
        order: {
          fullName: 'ASC',
        },
      }),
    ]);

    return {
      director: director ? this.toSummary(director) : null,
      programDirectors: programDirectors.map((signer) => this.toSummary(signer)),
    };
  }

  async create(
    upsertCertificateSignerDto: UpsertCertificateSignerDto,
  ): Promise<CertificateSignerSummary> {
    const signer = this.certificateSignerRepository.create({
      ...upsertCertificateSignerDto,
      isActive: upsertCertificateSignerDto.isActive ?? true,
    });

    await this.ensureDirectorUniqueness(signer);

    const savedSigner = await this.certificateSignerRepository.save(signer);
    return this.toSummary(await this.findEntityWithCoursesOrFail(savedSigner.id));
  }

  async update(
    id: string,
    upsertCertificateSignerDto: UpsertCertificateSignerDto,
  ): Promise<CertificateSignerSummary> {
    const signer = await this.findEntityOrFail(id);
    const shouldClearManagedCourses =
      signer.role === CertificateSignerRole.PROGRAM_DIRECTOR &&
      (upsertCertificateSignerDto.role !== CertificateSignerRole.PROGRAM_DIRECTOR ||
        upsertCertificateSignerDto.isActive === false);

    signer.fullName = upsertCertificateSignerDto.fullName;
    signer.role = upsertCertificateSignerDto.role;
    signer.title = upsertCertificateSignerDto.title;
    signer.signatureData = upsertCertificateSignerDto.signatureData;
    signer.isActive = upsertCertificateSignerDto.isActive ?? true;

    await this.ensureDirectorUniqueness(signer);

    const savedSigner = await this.certificateSignerRepository.save(signer);

    if (shouldClearManagedCourses) {
      await this.courseRepository.update(
        { programDirectorId: savedSigner.id },
        { programDirectorId: null },
      );
    }

    return this.toSummary(await this.findEntityWithCoursesOrFail(savedSigner.id));
  }

  async delete(id: string): Promise<void> {
    const signer = await this.findEntityOrFail(id);
    await this.courseRepository.update(
      { programDirectorId: signer.id },
      { programDirectorId: null },
    );
    await this.certificateSignerRepository.remove(signer);
  }

  async getCourseAssignments(
    id: string,
  ): Promise<CertificateSignerCourseAssignments> {
    const signer = await this.findEntityOrFail(id);
    this.ensureProgramDirectorRole(signer);

    const courses = await this.loadAssignableCourses();

    return {
      signerId: signer.id,
      courseIds: courses
        .filter((course) => course.programDirectorId === signer.id)
        .map((course) => course.id),
      courses: courses.map((course) => ({
        id: course.id,
        titleEn: course.titleEn,
        titleFi: course.titleFi,
        status: course.status,
        level: course.level,
        programDirectorId: course.programDirectorId,
      })),
    };
  }

  async updateCourseAssignments(
    id: string,
    dto: UpdateSignerCourseAssignmentsDto,
  ): Promise<CertificateSignerCourseAssignments> {
    const signer = await this.findEntityOrFail(id);
    this.ensureProgramDirectorRole(signer);

    const uniqueCourseIds = Array.from(new Set(dto.courseIds));

    if (uniqueCourseIds.length > 0) {
      const existingCourses = await this.courseRepository.find({
        where: {
          id: In(uniqueCourseIds),
        },
        select: {
          id: true,
        },
      });

      if (existingCourses.length !== uniqueCourseIds.length) {
        throw new NotFoundException('One or more courses were not found');
      }
    }

    await this.courseRepository.manager.transaction(async (manager) => {
      const transactionalCourseRepository = manager.getRepository(Course);

      await transactionalCourseRepository.update(
        { programDirectorId: signer.id },
        { programDirectorId: null },
      );

      if (uniqueCourseIds.length > 0) {
        await transactionalCourseRepository.update(
          { id: In(uniqueCourseIds) },
          { programDirectorId: signer.id },
        );
      }
    });

    return await this.getCourseAssignments(signer.id);
  }

  async findProgramDirectorById(id: string): Promise<CertificateSigner | null> {
    const signer = await this.certificateSignerRepository.findOne({
      where: {
        id,
        role: CertificateSignerRole.PROGRAM_DIRECTOR,
        isActive: true,
      },
    });

    return signer ?? null;
  }

  async getActiveDirector(): Promise<CertificateSigner | null> {
    return (
      (await this.certificateSignerRepository.findOne({
        where: {
          role: CertificateSignerRole.DIRECTOR,
          isActive: true,
        },
        order: {
          updatedAt: 'DESC',
        },
      })) ?? null
    );
  }

  async getActiveDirectorSummary(): Promise<CertificateSignerSummary | null> {
    const director = await this.getActiveDirector();
    return director ? this.toSummary(director) : null;
  }

  private async findEntityOrFail(id: string): Promise<CertificateSigner> {
    const signer = await this.certificateSignerRepository.findOne({
      where: { id },
    });

    if (!signer) {
      throw new NotFoundException('Certificate signer not found');
    }

    return signer;
  }

  private async findEntityWithCoursesOrFail(id: string): Promise<CertificateSigner> {
    const signer = await this.certificateSignerRepository.findOne({
      where: { id },
      relations: {
        managedCourses: true,
      },
    });

    if (!signer) {
      throw new NotFoundException('Certificate signer not found');
    }

    return signer;
  }

  private ensureProgramDirectorRole(signer: CertificateSigner): void {
    if (signer.role !== CertificateSignerRole.PROGRAM_DIRECTOR) {
      throw new BadRequestException(
        'Course assignments are only available for Program Directors',
      );
    }
  }

  private async ensureDirectorUniqueness(
    signer: CertificateSigner,
  ): Promise<void> {
    if (
      signer.role !== CertificateSignerRole.DIRECTOR ||
      !signer.isActive
    ) {
      return;
    }

    await this.certificateSignerRepository.update(
      {
        role: CertificateSignerRole.DIRECTOR,
        isActive: true,
      },
      { isActive: false },
    );
  }

  private async loadAssignableCourses(): Promise<Course[]> {
    return await this.courseRepository.find({
      select: {
        id: true,
        titleEn: true,
        titleFi: true,
        status: true,
        level: true,
        programDirectorId: true,
      },
      order: {
        titleEn: 'ASC',
      },
    });
  }

  private toSummary(signer: CertificateSigner): CertificateSignerSummary {
    const assignedCourses = [...(signer.managedCourses ?? [])]
      .sort((left, right) => left.titleEn.localeCompare(right.titleEn))
      .map((course) => ({
        id: course.id,
        titleEn: course.titleEn,
        titleFi: course.titleFi,
        status: course.status,
        level: course.level,
      }));

    return {
      id: signer.id,
      fullName: signer.fullName,
      role: signer.role,
      title: signer.title,
      signatureData: signer.signatureData,
      isActive: signer.isActive,
      createdAt: signer.createdAt,
      updatedAt: signer.updatedAt,
      assignedCourses,
    };
  }
}
