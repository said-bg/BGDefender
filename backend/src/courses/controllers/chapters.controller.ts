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
import { ChapterService } from '../services/chapters.service';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('courses/:courseId/chapters')
export class ChaptersController {
  constructor(private readonly chapterService: ChapterService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('courseId') courseId: string,
    @Body() createChapterDto: CreateChapterDto,
  ) {
    return await this.chapterService.create(courseId, createChapterDto);
  }

  @Get()
  async findAll(
    @Param('courseId') courseId: string,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedOffset = parseInt(offset, 10) || 0;
    const [data, count] = await this.chapterService.findAll(
      courseId,
      parsedLimit,
      parsedOffset,
    );
    return { data, count };
  }

  @Get(':id')
  async findById(
    @Param('courseId') courseId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.chapterService.findByIdInCourse(courseId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('courseId') courseId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateChapterDto: UpdateChapterDto,
  ) {
    await this.chapterService.findByIdInCourse(courseId, id);
    return await this.chapterService.update(id, updateChapterDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async delete(
    @Param('courseId') courseId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.chapterService.findByIdInCourse(courseId, id);
    await this.chapterService.delete(id);
  }
}
