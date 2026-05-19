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
import { PedagogicalContentService } from '../services/pedagogical-contents.service';
import { CreatePedagogicalContentDto } from '../dto/create-pedagogical-content.dto';
import { UpdatePedagogicalContentDto } from '../dto/update-pedagogical-content.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { CourseService } from '../services/course.service';

@Controller(
  'courses/:courseId/chapters/:chapterId/sub-chapters/:subChapterId/pedagogical-contents',
)
export class PedagogicalContentsController {
  constructor(
    private readonly pedagogicalContentService: PedagogicalContentService,
    private readonly courseService: CourseService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async create(
    @Param('courseId') courseId: string,
    @Param('subChapterId') subChapterId: string,
    @Body() createPedagogicalContentDto: CreatePedagogicalContentDto,
    @CurrentUser() currentUser: SafeUser,
  ) {
    await this.courseService.assertCanManageCourse(courseId, currentUser);
    return await this.pedagogicalContentService.create(
      subChapterId,
      createPedagogicalContentDto,
    );
  }

  @Get()
  async findAll(
    @Param('subChapterId') subChapterId: string,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedOffset = parseInt(offset, 10) || 0;
    const [data, count] = await this.pedagogicalContentService.findAll(
      subChapterId,
      parsedLimit,
      parsedOffset,
    );

    return { data, count };
  }

  @Get(':id')
  async findById(
    @Param('subChapterId') subChapterId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.pedagogicalContentService.findByIdInSubChapter(
      subChapterId,
      id,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async update(
    @Param('courseId') courseId: string,
    @Param('subChapterId') subChapterId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePedagogicalContentDto: UpdatePedagogicalContentDto,
    @CurrentUser() currentUser: SafeUser,
  ) {
    await this.courseService.assertCanManageCourse(courseId, currentUser);
    await this.pedagogicalContentService.findByIdInSubChapter(subChapterId, id);
    return await this.pedagogicalContentService.update(
      id,
      updatePedagogicalContentDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  @HttpCode(204)
  async delete(
    @Param('courseId') courseId: string,
    @Param('subChapterId') subChapterId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: SafeUser,
  ) {
    await this.courseService.assertCanManageCourse(courseId, currentUser);
    await this.pedagogicalContentService.findByIdInSubChapter(subChapterId, id);
    await this.pedagogicalContentService.delete(id);
  }
}
