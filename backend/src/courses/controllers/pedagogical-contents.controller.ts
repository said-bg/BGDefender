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
import { PedagogicalContentService } from '../services/pedagogical-contents.service';
import { CreatePedagogicalContentDto } from '../dto/create-pedagogical-content.dto';
import { UpdatePedagogicalContentDto } from '../dto/update-pedagogical-content.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from '../../auth/guards/admin-role.guard';

@Controller(
  'courses/:courseId/chapters/:chapterId/sub-chapters/:subChapterId/pedagogical-contents',
)
export class PedagogicalContentsController {
  constructor(
    private readonly pedagogicalContentService: PedagogicalContentService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async create(
    @Param('subChapterId') subChapterId: string,
    @Body() createPedagogicalContentDto: CreatePedagogicalContentDto,
  ) {
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
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async update(
    @Param('subChapterId') subChapterId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePedagogicalContentDto: UpdatePedagogicalContentDto,
  ) {
    await this.pedagogicalContentService.findByIdInSubChapter(subChapterId, id);
    return await this.pedagogicalContentService.update(
      id,
      updatePedagogicalContentDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @HttpCode(204)
  async delete(
    @Param('subChapterId') subChapterId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.pedagogicalContentService.findByIdInSubChapter(subChapterId, id);
    await this.pedagogicalContentService.delete(id);
  }
}
