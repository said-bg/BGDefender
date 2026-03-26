import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';
import { Course } from '../../entities/course.entity';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';

@Injectable()
export class ChapterService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(
    courseId: string,
    createChapterDto: CreateChapterDto,
  ): Promise<Chapter> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const chapter = this.chapterRepository.create({
      ...createChapterDto,
      courseId,
    });
    return await this.chapterRepository.save(chapter);
  }

  async findAll(
    courseId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Chapter[], number]> {
    return await this.chapterRepository.findAndCount({
      where: { courseId },
      take: limit,
      skip: offset,
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: string): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    return chapter;
  }

  async findByIdInCourse(courseId: string, id: string): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id, courseId },
    });

    if (!chapter) {
      throw new NotFoundException(
        `Chapter with ID ${id} not found in Course ${courseId}`,
      );
    }

    return chapter;
  }

  async update(
    id: string,
    updateChapterDto: UpdateChapterDto,
  ): Promise<Chapter> {
    const chapter = await this.findById(id);
    Object.assign(chapter, updateChapterDto);
    return await this.chapterRepository.save(chapter);
  }

  async delete(id: string): Promise<void> {
    const chapter = await this.findById(id);
    await this.chapterRepository.remove(chapter);
  }
}
