import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { SafeUser } from './types/safe-user.type';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { EmailService } from '../email/email.service';
import { PasswordTokenService } from './services/password-token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly passwordTokenService: PasswordTokenService,
  ) {}

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
  @HttpCode(HttpStatus.OK)
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

  /**
   * POST /auth/forgot-password
   * Envoie un lien de reset password à l'utilisateur
   * IMPORTANT: réponse générique toujours (security: don't leak email existence)
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.authService.findByEmail(forgotPasswordDto.email);

    if (user) {
      const token = await this.passwordTokenService.createResetToken(
        user.email,
      );
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      await this.emailService.sendPasswordResetEmail(user.email, resetLink);
    }

    return {
      message:
        'If an account exists with this email, a reset link has been sent',
    };
  }

  /**
   * POST /auth/reset-password
   * Réinitialise le password avec un token valide
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    // Find the token and get the email
    const { id: tokenId, email } =
      await this.passwordTokenService.findTokenByPlainToken(
        resetPasswordDto.token,
      );

    // Update password
    await this.authService.updatePassword(email, resetPasswordDto.newPassword);

    // Mark token as used
    await this.passwordTokenService.markAsUsed(tokenId);

    return { message: 'Password has been reset successfully' };
  }
}
