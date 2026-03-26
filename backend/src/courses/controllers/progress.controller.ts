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
  UseGuards,
} from '@nestjs/common';
import { ProgressService } from '../services/progress.service';
import { CreateProgressDto } from '../dto/create-progress.dto';
import { UpdateProgressDto } from '../dto/update-progress.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createProgressDto: CreateProgressDto) {
    return await this.progressService.create(createProgressDto);
  }

  @Get('user/:userId/course/:courseId')
  async findByUserAndCourse(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    const progress = await this.progressService.findByUserAndCourse(
      userId,
      courseId,
    );

    if (!progress) {
      return null;
    }

    return progress;
  }

  @Get(':id')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.progressService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return await this.progressService.update(id, updateProgressDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.progressService.delete(id);
  }
}
