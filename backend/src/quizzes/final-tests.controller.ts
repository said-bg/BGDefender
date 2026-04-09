import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/types/safe-user.type';
import { resolveLanguage } from '../config/request-language';
import { SubmitChapterQuizAttemptDto } from './dto/submit-chapter-quiz-attempt.dto';
import { UpsertChapterQuizDto } from './dto/upsert-chapter-quiz.dto';
import { QuizzesService } from './quizzes.service';

@Controller('courses/:courseId/final-test')
@UseGuards(JwtAuthGuard)
export class FinalTestsController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  async getCourseFinalTest(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @CurrentUser() currentUser: SafeUser,
  ) {
    return this.quizzesService.getCourseFinalTest(courseId, currentUser);
  }

  @Put()
  @UseGuards(AdminRoleGuard)
  async upsertCourseFinalTest(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Body() dto: UpsertChapterQuizDto,
  ) {
    return this.quizzesService.upsertCourseFinalTest(courseId, dto);
  }

  @Delete()
  @UseGuards(AdminRoleGuard)
  @HttpCode(204)
  async deleteCourseFinalTest(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    await this.quizzesService.deleteCourseFinalTest(
      courseId,
      resolveLanguage(acceptLanguage),
    );
  }

  @Post('attempts')
  async submitCourseFinalTestAttempt(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Body() dto: SubmitChapterQuizAttemptDto,
    @CurrentUser() currentUser: SafeUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.quizzesService.submitCourseFinalTestAttempt(
      courseId,
      currentUser,
      dto,
      resolveLanguage(acceptLanguage),
    );
  }
}
