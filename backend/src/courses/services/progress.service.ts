import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from '../../entities/progress.entity';
import { User } from '../../entities/user.entity';
import { Course } from '../../entities/course.entity';
import { CreateProgressDto } from '../dto/create-progress.dto';
import { UpdateProgressDto } from '../dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(createProgressDto: CreateProgressDto): Promise<Progress> {
    const user = await this.userRepository.findOne({
      where: { email: createProgressDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createProgressDto.userId} not found`,
      );
    }

    const course = await this.courseRepository.findOne({
      where: { id: createProgressDto.courseId },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ID ${createProgressDto.courseId} not found`,
      );
    }

    const progress = this.progressRepository.create(createProgressDto);
    return await this.progressRepository.save(progress);
  }

  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<Progress | null> {
    return await this.progressRepository.findOne({
      where: { userId, courseId },
    });
  }

  async findById(id: string): Promise<Progress> {
    const progress = await this.progressRepository.findOne({
      where: { id },
    });

    if (!progress) {
      throw new NotFoundException(`Progress with ID ${id} not found`);
    }

    return progress;
  }

  async update(
    id: string,
    updateProgressDto: UpdateProgressDto,
  ): Promise<Progress> {
    const progress = await this.findById(id);

    Object.assign(progress, updateProgressDto);

    if (progress.completionPercentage === 100 && !progress.completed) {
      progress.completed = true;
      progress.completedAt = new Date();
    }

    progress.lastAccessedAt = new Date();

    return await this.progressRepository.save(progress);
  }

  async delete(id: string): Promise<void> {
    const progress = await this.findById(id);
    await this.progressRepository.remove(progress);
  }
}
