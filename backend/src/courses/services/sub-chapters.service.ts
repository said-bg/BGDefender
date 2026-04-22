import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubChapter } from '../../entities/sub-chapter.entity';
import { Chapter } from '../../entities/chapter.entity';
import { CreateSubChapterDto } from '../dto/create-sub-chapter.dto';
import { UpdateSubChapterDto } from '../dto/update-sub-chapter.dto';
import {
  clampOrderIndex,
  normalizeOrderIndexes,
  shiftAfterDelete,
  shiftForInsert,
  shiftForMove,
} from './order-index.utils';

@Injectable()
export class SubChapterService {
  constructor(
    @InjectRepository(SubChapter)
    private readonly subChapterRepository: Repository<SubChapter>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
  ) {}

  async create(
    chapterId: string,
    createSubChapterDto: CreateSubChapterDto,
  ): Promise<SubChapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }

    const siblings = await this.subChapterRepository.find({
      where: { chapterId },
      order: { orderIndex: 'ASC' },
    });
    const normalizedSubChapters = normalizeOrderIndexes(siblings);

    if (normalizedSubChapters.length > 0) {
      await this.subChapterRepository.save(normalizedSubChapters);
    }

    const orderIndex = clampOrderIndex(
      createSubChapterDto.orderIndex,
      siblings.length + 1,
    );
    const shiftedSubChapters = shiftForInsert(siblings, orderIndex);

    if (shiftedSubChapters.length > 0) {
      await this.subChapterRepository.save(shiftedSubChapters);
    }

    const subChapter = this.subChapterRepository.create({
      ...createSubChapterDto,
      orderIndex,
      chapterId,
    });

    return await this.subChapterRepository.save(subChapter);
  }

  async findAll(
    chapterId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<[SubChapter[], number]> {
    return await this.subChapterRepository.findAndCount({
      where: { chapterId },
      take: limit,
      skip: offset,
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: string): Promise<SubChapter> {
    const subChapter = await this.subChapterRepository.findOne({
      where: { id },
    });

    if (!subChapter) {
      throw new NotFoundException(`SubChapter with ID ${id} not found`);
    }

    return subChapter;
  }

  async findByIdInChapter(chapterId: string, id: string): Promise<SubChapter> {
    const subChapter = await this.subChapterRepository.findOne({
      where: { id, chapterId },
    });

    if (!subChapter) {
      throw new NotFoundException(
        `SubChapter with ID ${id} not found in Chapter ${chapterId}`,
      );
    }

    return subChapter;
  }

  async update(
    id: string,
    updateSubChapterDto: UpdateSubChapterDto,
  ): Promise<SubChapter> {
    const subChapter = await this.findById(id);
    const siblings = await this.subChapterRepository.find({
      where: { chapterId: subChapter.chapterId },
      order: { orderIndex: 'ASC' },
    });
    const normalizedSubChapters = normalizeOrderIndexes(siblings);

    if (normalizedSubChapters.length > 0) {
      await this.subChapterRepository.save(normalizedSubChapters);
    }

    let nextOrderIndex = subChapter.orderIndex;
    if (updateSubChapterDto.orderIndex !== undefined) {
      nextOrderIndex = clampOrderIndex(
        updateSubChapterDto.orderIndex,
        siblings.length,
      );
      const shiftedSubChapters = shiftForMove(
        siblings,
        subChapter.id,
        subChapter.orderIndex,
        nextOrderIndex,
      );

      if (shiftedSubChapters.length > 0) {
        await this.subChapterRepository.save(shiftedSubChapters);
      }
    }

    Object.assign(subChapter, updateSubChapterDto);
    subChapter.orderIndex = nextOrderIndex;
    return await this.subChapterRepository.save(subChapter);
  }

  async delete(id: string): Promise<void> {
    const subChapter = await this.findById(id);
    const siblings = await this.subChapterRepository.find({
      where: { chapterId: subChapter.chapterId },
      order: { orderIndex: 'ASC' },
    });
    const normalizedSubChapters = normalizeOrderIndexes(siblings);

    if (normalizedSubChapters.length > 0) {
      await this.subChapterRepository.save(normalizedSubChapters);
    }
    await this.subChapterRepository.remove(subChapter);

    const shiftedSubChapters = shiftAfterDelete(
      siblings,
      subChapter.id,
      subChapter.orderIndex,
    );

    if (shiftedSubChapters.length > 0) {
      await this.subChapterRepository.save(shiftedSubChapters);
    }
  }
}
