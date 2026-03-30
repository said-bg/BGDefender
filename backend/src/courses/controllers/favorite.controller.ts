import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { FavoriteService } from '../services/favorite.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get('me')
  async findMyFavorites(@CurrentUser() user: SafeUser) {
    return this.favoriteService.findAllForUser(user.id);
  }

  @Get('me/course/:courseId')
  async findMyCourseFavorite(
    @CurrentUser() user: SafeUser,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    return this.favoriteService.findByUserAndCourse(user.id, courseId);
  }

  @Put('me/course/:courseId')
  async addMyCourseFavorite(
    @CurrentUser() user: SafeUser,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    return this.favoriteService.addForUserAndCourse(user.id, courseId);
  }

  @Delete('me/course/:courseId')
  @HttpCode(204)
  async deleteMyCourseFavorite(
    @CurrentUser() user: SafeUser,
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
  ) {
    await this.favoriteService.deleteByUserAndCourse(user.id, courseId);
  }
}
