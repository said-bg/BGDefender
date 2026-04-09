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

@Controller('courses/:courseId/chapters/:chapterId/quiz')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  async getChapterQuiz(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('chapterId', new ParseUUIDPipe()) chapterId: string,
    @CurrentUser() currentUser: SafeUser,
  ) {
    return this.quizzesService.getChapterQuiz(courseId, chapterId, currentUser);
  }

  @Put()
  @UseGuards(AdminRoleGuard)
  async upsertChapterQuiz(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('chapterId', new ParseUUIDPipe()) chapterId: string,
    @Body() dto: UpsertChapterQuizDto,
  ) {
    return this.quizzesService.upsertChapterQuiz(courseId, chapterId, dto);
  }

  @Delete()
  @UseGuards(AdminRoleGuard)
  @HttpCode(204)
  async deleteChapterQuiz(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('chapterId', new ParseUUIDPipe()) chapterId: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    await this.quizzesService.deleteChapterQuiz(
      courseId,
      chapterId,
      resolveLanguage(acceptLanguage),
    );
  }

  @Post('attempts')
  async submitChapterQuizAttempt(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('chapterId', new ParseUUIDPipe()) chapterId: string,
    @Body() dto: SubmitChapterQuizAttemptDto,
    @CurrentUser() currentUser: SafeUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.quizzesService.submitChapterQuizAttempt(
      courseId,
      chapterId,
      currentUser.id,
      dto,
      resolveLanguage(acceptLanguage),
    );
  }
}
