import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
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
   * Accepts Accept-Language header for localized error messages
   */
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<SafeUser> {
    // Extract language from Accept-Language header
    let language = 'en';
    if (acceptLanguage) {
      const langCode = acceptLanguage.split('-')[0].toLowerCase();
      if (['fi', 'en'].includes(langCode)) {
        language = langCode;
      }
    }
    return this.authService.register(registerDto, language);
  }

  /**
   * POST /auth/login
   * Authentifie l'utilisateur et retourne JWT
   * Accepts Accept-Language header for localized error messages
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ accessToken: string; user: SafeUser }> {
    // Extract language from Accept-Language header (e.g., "fi-FI,fi;q=0.9" -> "fi")
    let language = 'en';
    if (acceptLanguage) {
      const langCode = acceptLanguage.split('-')[0].toLowerCase();
      if (['fi', 'en'].includes(langCode)) {
        language = langCode;
      }
    }
    return this.authService.login(loginDto, language);
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
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ message: string }> {
    const user = await this.authService.findByEmail(forgotPasswordDto.email);

    // Extract language from Accept-Language header (e.g., "fi-FI,fi;q=0.9" -> "fi")
    let language = 'en';
    if (acceptLanguage) {
      const langCode = acceptLanguage.split('-')[0].toLowerCase();
      if (['fi', 'en'].includes(langCode)) {
        language = langCode;
      }
    }

    if (user) {
      const token = await this.passwordTokenService.createResetToken(
        user.email,
      );
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}&lang=${language}`;

      // Log token for development testing
      console.log('\n✅ PASSWORD RESET TOKEN GENERATED:');
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Token: ${token}`);
      console.log(`🔗 Link: ${resetLink}`);
      console.log(`🌍 Language: ${language}`);
      console.log('⏱️  Token expires in 1 hour\n');

      // Send email in user's language
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetLink,
        language,
      );
    } else {
      console.log(`⚠️  No user found for email: ${forgotPasswordDto.email}`);
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
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ message: string }> {
    // Extract language from Accept-Language header
    let language = 'en';
    if (acceptLanguage) {
      const langCode = acceptLanguage.split('-')[0].toLowerCase();
      if (['fi', 'en'].includes(langCode)) {
        language = langCode;
      }
    }

    // Find the token and get the email
    const { id: tokenId, email } =
      await this.passwordTokenService.findTokenByPlainToken(
        resetPasswordDto.token,
      );

    // Update password
    await this.authService.updatePassword(
      email,
      resetPasswordDto.newPassword,
      language,
    );

    // Mark token as used
    await this.passwordTokenService.markAsUsed(tokenId);

    return { message: 'Password has been reset successfully' };
  }
}
