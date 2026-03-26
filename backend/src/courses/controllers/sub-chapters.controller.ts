import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubChapterService } from '../services/sub-chapters.service';
import { CreateSubChapterDto } from '../dto/create-sub-chapter.dto';
import { UpdateSubChapterDto } from '../dto/update-sub-chapter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('courses/:courseId/chapters/:chapterId/sub-chapters')
export class SubChaptersController {
  constructor(private readonly subChapterService: SubChapterService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('chapterId') chapterId: string,
    @Body() createSubChapterDto: CreateSubChapterDto,
  ) {
    return await this.subChapterService.create(chapterId, createSubChapterDto);
  }

  @Get()
  async findAll(
    @Param('chapterId') chapterId: string,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedOffset = parseInt(offset, 10) || 0;
    const [data, count] = await this.subChapterService.findAll(
      chapterId,
      parsedLimit,
      parsedOffset,
    );

    return { data, count };
  }

  @Get(':id')
  async findById(
    @Param('chapterId') chapterId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.subChapterService.findByIdInChapter(chapterId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('chapterId') chapterId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSubChapterDto: UpdateSubChapterDto,
  ) {
    await this.subChapterService.findByIdInChapter(chapterId, id);
    return await this.subChapterService.update(id, updateSubChapterDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async delete(
    @Param('chapterId') chapterId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.subChapterService.findByIdInChapter(chapterId, id);
    await this.subChapterService.delete(id);
  }
}
