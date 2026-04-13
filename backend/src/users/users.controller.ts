import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SafeUser } from '../auth/types/safe-user.type';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UsersService } from './users.service';
import { resolveLanguage } from '../config/request-language';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async listUsers(@Query() query: ListUsersDto) {
    return this.usersService.listUsers(query);
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminUserDto: UpdateAdminUserDto,
    @CurrentUser() currentUser: SafeUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.usersService.updateAdminUser(
      id,
      updateAdminUserDto,
      currentUser.id,
      resolveLanguage(acceptLanguage),
    );
  }

  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: SafeUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.usersService.deleteAdminUser(
      id,
      currentUser.id,
      resolveLanguage(acceptLanguage),
    );
  }
}
