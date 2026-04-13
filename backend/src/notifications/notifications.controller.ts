import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/types/safe-user.type';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  async listMyNotifications(
    @CurrentUser() currentUser: SafeUser,
    @Query('limit') limit = '8',
  ) {
    const parsedLimit = Number.parseInt(limit, 10);

    return this.notificationsService.listMyNotifications(
      currentUser.id,
      Number.isNaN(parsedLimit) ? 8 : parsedLimit,
    );
  }

  @Patch('me/:id/read')
  @HttpCode(204)
  async markAsRead(
    @CurrentUser() currentUser: SafeUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.notificationsService.markAsRead(currentUser.id, id);
  }

  @Post('me/read-all')
  @HttpCode(204)
  async markAllAsRead(@CurrentUser() currentUser: SafeUser) {
    await this.notificationsService.markAllAsRead(currentUser.id);
  }

  @Delete('me')
  @HttpCode(204)
  async clearAll(@CurrentUser() currentUser: SafeUser) {
    await this.notificationsService.clearAll(currentUser.id);
  }
}
