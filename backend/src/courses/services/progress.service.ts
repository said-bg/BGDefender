import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress, ProgressViewType } from '../../entities/progress.entity';
import { Course } from '../../entities/course.entity';
import { Chapter } from '../../entities/chapter.entity';
import { SubChapter } from '../../entities/sub-chapter.entity';
import { UpdateProgressDto } from '../dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(SubChapter)
    private readonly subChapterRepository: Repository<SubChapter>,
  ) {}

  async findAllForUser(userId: number): Promise<Progress[]> {
    return this.progressRepository.find({
      where: { userId },
      relations: ['course'],
      order: { lastAccessedAt: 'DESC' },
    });
  }

  async findByUserAndCourse(
    userId: number,
    courseId: string,
  ): Promise<Progress | null> {
    return this.progressRepository.findOne({
      where: { userId, courseId },
    });
  }

  async upsertForUserAndCourse(
    userId: number,
    courseId: string,
    updateProgressDto: UpdateProgressDto,
  ): Promise<Progress> {
    await this.ensureValidTarget(courseId, updateProgressDto);

    const existingProgress = await this.findByUserAndCourse(userId, courseId);
    const progress =
      existingProgress ??
      this.progressRepository.create({
        userId,
        courseId,
        completionPercentage: 0,
        completed: false,
        completedAt: null,
        lastViewedType: null,
        lastChapterId: null,
        lastSubChapterId: null,
      });

    Object.assign(progress, updateProgressDto);
    this.normalizeProgressState(progress);

    // The percentage is the source of truth for completion state.
    if (progress.completionPercentage === 100) {
      progress.completed = true;
      progress.completedAt ??= new Date();
    } else {
      progress.completed = false;
      progress.completedAt = null;
    }

    progress.lastAccessedAt = new Date();

    return this.progressRepository.save(progress);
  }

  async deleteByUserAndCourse(userId: number, courseId: string): Promise<void> {
    const progress = await this.findByUserAndCourse(userId, courseId);

    if (!progress) {
      return;
    }

    await this.progressRepository.remove(progress);
  }

  private async ensureValidTarget(
    courseId: string,
    updateProgressDto: UpdateProgressDto,
  ): Promise<void> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const { lastViewedType, lastChapterId, lastSubChapterId } =
      updateProgressDto;

    if (lastViewedType === ProgressViewType.CHAPTER && !lastChapterId) {
      throw new BadRequestException(
        'lastChapterId is required when lastViewedType is chapter',
      );
    }

    if (lastViewedType === ProgressViewType.SUBCHAPTER) {
      if (!lastChapterId || !lastSubChapterId) {
        throw new BadRequestException(
          'lastChapterId and lastSubChapterId are required when lastViewedType is subchapter',
        );
      }
    }

    if (!lastChapterId) {
      return;
    }

    const chapter = await this.chapterRepository.findOne({
      where: { id: lastChapterId, courseId },
    });

    if (!chapter) {
      throw new NotFoundException(
        `Chapter with ID ${lastChapterId} not found for course ${courseId}`,
      );
    }

    if (!lastSubChapterId) {
      return;
    }

    const subChapter = await this.subChapterRepository.findOne({
      where: { id: lastSubChapterId, chapterId: lastChapterId },
    });

    if (!subChapter) {
      throw new NotFoundException(
        `Subchapter with ID ${lastSubChapterId} not found for chapter ${lastChapterId}`,
      );
    }
  }

  private normalizeProgressState(progress: Progress): void {
    if (progress.lastViewedType === ProgressViewType.OVERVIEW) {
      progress.lastChapterId = null;
      progress.lastSubChapterId = null;
      return;
    }

    if (progress.lastViewedType === ProgressViewType.CHAPTER) {
      progress.lastSubChapterId = null;
    }
  }
}
