import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PedagogicalContent } from '../../entities/pedagogical-content.entity';
import { SubChapter } from '../../entities/sub-chapter.entity';
import { CreatePedagogicalContentDto } from '../dto/create-pedagogical-content.dto';
import { UpdatePedagogicalContentDto } from '../dto/update-pedagogical-content.dto';
import {
  clampOrderIndex,
  normalizeOrderIndexes,
  shiftAfterDelete,
  shiftForInsert,
  shiftForMove,
} from './order-index.utils';

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

    const siblings = await this.pedagogicalContentRepository.find({
      where: { subChapterId },
      order: { orderIndex: 'ASC' },
    });
    const normalizedContents = normalizeOrderIndexes(siblings);

    if (normalizedContents.length > 0) {
      await this.pedagogicalContentRepository.save(normalizedContents);
    }

    const orderIndex = clampOrderIndex(
      createPedagogicalContentDto.orderIndex,
      siblings.length + 1,
    );
    const shiftedContents = shiftForInsert(siblings, orderIndex);

    if (shiftedContents.length > 0) {
      await this.pedagogicalContentRepository.save(shiftedContents);
    }

    const pedagogicalContent = this.pedagogicalContentRepository.create({
      ...createPedagogicalContentDto,
      orderIndex,
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
    const siblings = await this.pedagogicalContentRepository.find({
      where: { subChapterId: pedagogicalContent.subChapterId },
      order: { orderIndex: 'ASC' },
    });
    const normalizedContents = normalizeOrderIndexes(siblings);

    if (normalizedContents.length > 0) {
      await this.pedagogicalContentRepository.save(normalizedContents);
    }

    let nextOrderIndex = pedagogicalContent.orderIndex;
    if (updatePedagogicalContentDto.orderIndex !== undefined) {
      nextOrderIndex = clampOrderIndex(
        updatePedagogicalContentDto.orderIndex,
        siblings.length,
      );
      const shiftedContents = shiftForMove(
        siblings,
        pedagogicalContent.id,
        pedagogicalContent.orderIndex,
        nextOrderIndex,
      );

      if (shiftedContents.length > 0) {
        await this.pedagogicalContentRepository.save(shiftedContents);
      }
    }

    Object.assign(pedagogicalContent, updatePedagogicalContentDto);
    pedagogicalContent.orderIndex = nextOrderIndex;
    return await this.pedagogicalContentRepository.save(pedagogicalContent);
  }

  async delete(id: string): Promise<void> {
    const pedagogicalContent = await this.findById(id);
    const siblings = await this.pedagogicalContentRepository.find({
      where: { subChapterId: pedagogicalContent.subChapterId },
      order: { orderIndex: 'ASC' },
    });
    const normalizedContents = normalizeOrderIndexes(siblings);

    if (normalizedContents.length > 0) {
      await this.pedagogicalContentRepository.save(normalizedContents);
    }
    await this.pedagogicalContentRepository.remove(pedagogicalContent);

    const shiftedContents = shiftAfterDelete(
      siblings,
      pedagogicalContent.id,
      pedagogicalContent.orderIndex,
    );

    if (shiftedContents.length > 0) {
      await this.pedagogicalContentRepository.save(shiftedContents);
    }
  }
}
