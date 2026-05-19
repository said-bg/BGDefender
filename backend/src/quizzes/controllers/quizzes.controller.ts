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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminOrCreatorRoleGuard } from '../../auth/guards/admin-or-creator-role.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { resolveLanguage } from '../../config/request-language';
import { CourseService } from '../../courses/services/course.service';
import { SubmitChapterQuizAttemptDto } from '../dto/submit-chapter-quiz-attempt.dto';
import { UpsertChapterQuizDto } from '../dto/upsert-chapter-quiz.dto';
import { QuizzesService } from '../services/quizzes.service';

@Controller('courses/:courseId/chapters/:chapterId/quiz')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,
    private readonly courseService: CourseService,
  ) {}

  @Get()
  async getChapterQuiz(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('chapterId', new ParseUUIDPipe()) chapterId: string,
    @CurrentUser() currentUser: SafeUser,
  ) {
    return this.quizzesService.getChapterQuiz(courseId, chapterId, currentUser);
  }

  @Get('analytics')
  @UseGuards(AdminOrCreatorRoleGuard)
  async getChapterQuizAnalytics(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('chapterId', new ParseUUIDPipe()) chapterId: string,
    @CurrentUser() currentUser: SafeUser,
  ) {
    await this.courseService.assertCanManageCourse(courseId, currentUser);
    return this.quizzesService.getChapterQuizAnalytics(courseId, chapterId);
  }

  @Put()
  @UseGuards(AdminOrCreatorRoleGuard)
  async upsertChapterQuiz(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('chapterId', new ParseUUIDPipe()) chapterId: string,
    @Body() dto: UpsertChapterQuizDto,
    @CurrentUser() currentUser: SafeUser,
  ) {
    await this.courseService.assertCanManageCourse(courseId, currentUser);
    return this.quizzesService.upsertChapterQuiz(courseId, chapterId, dto);
  }

  @Delete()
  @UseGuards(AdminOrCreatorRoleGuard)
  @HttpCode(204)
  async deleteChapterQuiz(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Param('chapterId', new ParseUUIDPipe()) chapterId: string,
    @CurrentUser() currentUser: SafeUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    await this.courseService.assertCanManageCourse(courseId, currentUser);
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
