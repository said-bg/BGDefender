import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubChapter } from '../../entities/sub-chapter.entity';
import { Chapter } from '../../entities/chapter.entity';
import { CreateSubChapterDto } from '../dto/create-sub-chapter.dto';
import { UpdateSubChapterDto } from '../dto/update-sub-chapter.dto';

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

    const subChapter = this.subChapterRepository.create({
      ...createSubChapterDto,
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
    Object.assign(subChapter, updateSubChapterDto);
    return await this.subChapterRepository.save(subChapter);
  }

  async delete(id: string): Promise<void> {
    const subChapter = await this.findById(id);
    await this.subChapterRepository.remove(subChapter);
  }
}
