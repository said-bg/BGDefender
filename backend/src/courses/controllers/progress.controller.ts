import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProgressService } from '../services/progress.service';
import { UpdateProgressDto } from '../dto/update-progress.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { SafeUser } from '../../auth/types/safe-user.type';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('me')
  async findMyProgress(@CurrentUser() user: SafeUser) {
    return this.progressService.findAllForUser(user.id);
  }

  @Get('me/course/:courseId')
  async findMyCourseProgress(
    @CurrentUser() user: SafeUser,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    return this.progressService.findByUserAndCourse(user.id, courseId);
  }

  @Put('me/course/:courseId')
  async upsertMyCourseProgress(
    @CurrentUser() user: SafeUser,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.progressService.upsertForUserAndCourse(
      user.id,
      courseId,
      updateProgressDto,
    );
  }

  @Delete('me/course/:courseId')
  @HttpCode(204)
  async deleteMyCourseProgress(
    @CurrentUser() user: SafeUser,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    await this.progressService.deleteByUserAndCourse(user.id, courseId);
  }
}
