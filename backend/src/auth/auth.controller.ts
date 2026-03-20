import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { SafeUser } from './types/safe-user.type';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Enregistre un nouvel utilisateur
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<SafeUser> {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   * Authentifie l'utilisateur et retourne JWT
   */
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: SafeUser }> {
    return this.authService.login(loginDto);
  }

  /**
   * GET /auth/me
   * Retourne l'utilisateur courant (authentifié)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: SafeUser): SafeUser {
    return user;
  }
}
