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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminOrCreatorRoleGuard } from '../../auth/guards/admin-or-creator-role.guard';
import { SubChapterService } from '../services/sub-chapters.service';
import { CreateSubChapterDto } from '../dto/create-sub-chapter.dto';
import { UpdateSubChapterDto } from '../dto/update-sub-chapter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { CourseService } from '../services/course.service';

@Controller('courses/:courseId/chapters/:chapterId/sub-chapters')
export class SubChaptersController {
  constructor(
    private readonly subChapterService: SubChapterService,
    private readonly courseService: CourseService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async create(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() createSubChapterDto: CreateSubChapterDto,
    @CurrentUser() currentUser: SafeUser,
  ) {
    await this.courseService.assertCanManageCourse(courseId, currentUser);
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
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async update(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSubChapterDto: UpdateSubChapterDto,
    @CurrentUser() currentUser: SafeUser,
  ) {
    await this.courseService.assertCanManageCourse(courseId, currentUser);
    await this.subChapterService.findByIdInChapter(chapterId, id);
    return await this.subChapterService.update(id, updateSubChapterDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  @HttpCode(204)
  async delete(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: SafeUser,
  ) {
    await this.courseService.assertCanManageCourse(courseId, currentUser);
    await this.subChapterService.findByIdInChapter(chapterId, id);
    await this.subChapterService.delete(id);
  }
}
