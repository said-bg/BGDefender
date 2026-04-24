import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../../entities/chapter.entity';
import { Course } from '../../entities/course.entity';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';
import {
  clampOrderIndex,
  normalizeOrderIndexes,
  shiftAfterDelete,
  shiftForInsert,
  shiftForMove,
} from './order-index.utils';

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

    const siblings = await this.chapterRepository.find({
      where: { courseId },
      order: { orderIndex: 'ASC' },
    });
    const normalizedChapters = normalizeOrderIndexes(siblings);

    if (normalizedChapters.length > 0) {
      await this.chapterRepository.save(normalizedChapters);
    }

    const orderIndex = clampOrderIndex(
      createChapterDto.orderIndex,
      siblings.length + 1,
    );
    const shiftedChapters = shiftForInsert(siblings, orderIndex);

    if (shiftedChapters.length > 0) {
      await this.chapterRepository.save(shiftedChapters);
    }

    const chapter = this.chapterRepository.create({
      ...createChapterDto,
      orderIndex,
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
    const siblings = await this.chapterRepository.find({
      where: { courseId: chapter.courseId },
      order: { orderIndex: 'ASC' },
    });
    const normalizedChapters = normalizeOrderIndexes(siblings);

    if (normalizedChapters.length > 0) {
      await this.chapterRepository.save(normalizedChapters);
    }

    let nextOrderIndex = chapter.orderIndex;
    if (updateChapterDto.orderIndex !== undefined) {
      nextOrderIndex = clampOrderIndex(
        updateChapterDto.orderIndex,
        siblings.length,
      );
      const shiftedChapters = shiftForMove(
        siblings,
        chapter.id,
        chapter.orderIndex,
        nextOrderIndex,
      );

      if (shiftedChapters.length > 0) {
        await this.chapterRepository.save(shiftedChapters);
      }
    }

    Object.assign(chapter, updateChapterDto);
    chapter.orderIndex = nextOrderIndex;
    return await this.chapterRepository.save(chapter);
  }

  async delete(id: string): Promise<void> {
    const chapter = await this.findById(id);
    const siblings = await this.chapterRepository.find({
      where: { courseId: chapter.courseId },
      order: { orderIndex: 'ASC' },
    });
    const normalizedChapters = normalizeOrderIndexes(siblings);

    if (normalizedChapters.length > 0) {
      await this.chapterRepository.save(normalizedChapters);
    }

    await this.chapterRepository.remove(chapter);

    const shiftedChapters = shiftAfterDelete(
      siblings,
      chapter.id,
      chapter.orderIndex,
    );

    if (shiftedChapters.length > 0) {
      await this.chapterRepository.save(shiftedChapters);
    }
  }
}
