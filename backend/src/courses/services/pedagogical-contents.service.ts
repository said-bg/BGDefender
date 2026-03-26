import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PedagogicalContent } from '../../entities/pedagogical-content.entity';
import { SubChapter } from '../../entities/sub-chapter.entity';
import { CreatePedagogicalContentDto } from '../dto/create-pedagogical-content.dto';
import { UpdatePedagogicalContentDto } from '../dto/update-pedagogical-content.dto';

@Injectable()
export class PedagogicalContentService {
  constructor(
    @InjectRepository(PedagogicalContent)
    private readonly pedagogicalContentRepository: Repository<PedagogicalContent>,
    @InjectRepository(SubChapter)
    private readonly subChapterRepository: Repository<SubChapter>,
  ) {}

  async create(
    subChapterId: string,
    createPedagogicalContentDto: CreatePedagogicalContentDto,
  ): Promise<PedagogicalContent> {
    const subChapter = await this.subChapterRepository.findOne({
      where: { id: subChapterId },
    });

    if (!subChapter) {
      throw new NotFoundException(
        `SubChapter with ID ${subChapterId} not found`,
      );
    }

    const pedagogicalContent = this.pedagogicalContentRepository.create({
      ...createPedagogicalContentDto,
      subChapterId,
    });

    return await this.pedagogicalContentRepository.save(pedagogicalContent);
  }

  async findAll(
    subChapterId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<[PedagogicalContent[], number]> {
    return await this.pedagogicalContentRepository.findAndCount({
      where: { subChapterId },
      take: limit,
      skip: offset,
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: string): Promise<PedagogicalContent> {
    const pedagogicalContent = await this.pedagogicalContentRepository.findOne({
      where: { id },
    });

    if (!pedagogicalContent) {
      throw new NotFoundException(`PedagogicalContent with ID ${id} not found`);
    }

    return pedagogicalContent;
  }

  async findByIdInSubChapter(
    subChapterId: string,
    id: string,
  ): Promise<PedagogicalContent> {
    const pedagogicalContent = await this.pedagogicalContentRepository.findOne({
      where: { id, subChapterId },
    });

    if (!pedagogicalContent) {
      throw new NotFoundException(
        `PedagogicalContent with ID ${id} not found in SubChapter ${subChapterId}`,
      );
    }

    return pedagogicalContent;
  }

  async update(
    id: string,
    updatePedagogicalContentDto: UpdatePedagogicalContentDto,
  ): Promise<PedagogicalContent> {
    const pedagogicalContent = await this.findById(id);
    Object.assign(pedagogicalContent, updatePedagogicalContentDto);
    return await this.pedagogicalContentRepository.save(pedagogicalContent);
  }

  async delete(id: string): Promise<void> {
    const pedagogicalContent = await this.findById(id);
    await this.pedagogicalContentRepository.remove(pedagogicalContent);
  }
}
