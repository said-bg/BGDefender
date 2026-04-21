import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import type { SafeUser } from '../types/safe-user.type';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { EmailService } from '../../email/email.service';
import { PasswordTokenService } from '../services/password-token.service';
import { resolveLanguage } from '../../config/request-language';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly passwordTokenService: PasswordTokenService,
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<SafeUser> {
    const language = resolveLanguage(acceptLanguage);
    return this.authService.register(registerDto, language);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ accessToken: string; user: SafeUser }> {
    const language = resolveLanguage(acceptLanguage);
    return this.authService.login(loginDto, language);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: SafeUser): SafeUser {
    return user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateCurrentUser(
    @CurrentUser() user: SafeUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<SafeUser> {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ message: string }> {
    const user = await this.authService.findByEmail(forgotPasswordDto.email);
    const language = resolveLanguage(acceptLanguage);

    if (user) {
      const token = await this.passwordTokenService.createResetToken(
        user.email,
      );
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}&lang=${language}`;
      const shouldLogResetTokens = process.env.LOG_RESET_TOKENS === 'true';

      if (shouldLogResetTokens) {
        console.log('\nPASSWORD RESET TOKEN GENERATED:');
        console.log(`Email: ${user.email}`);
        console.log(`Token: ${token}`);
        console.log(`Link: ${resetLink}`);
        console.log(`Language: ${language}`);
        console.log('Token expires in 1 hour\n');
      }

      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetLink,
        language,
      );
    }

    return {
      message:
        language === 'fi'
          ? 'Jos tilisi loytyy talla sahkopostiosoitteella, palautuslinkki on lahetetty.'
          : 'If an account exists with this email, a reset link has been sent',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ message: string }> {
    const language = resolveLanguage(acceptLanguage);

    const { id: tokenId, email } =
      await this.passwordTokenService.findTokenByPlainToken(
        resetPasswordDto.token,
      );

    await this.authService.updatePassword(
      email,
      resetPasswordDto.newPassword,
      language,
    );

    await this.passwordTokenService.markAsUsed(tokenId);

    return {
      message:
        language === 'fi'
          ? 'Salasana on nollattu onnistuneesti.'
          : 'Password has been reset successfully',
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: SafeUser,
    @Body() changePasswordDto: ChangePasswordDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ message: string }> {
    const language = resolveLanguage(acceptLanguage);

    await this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      language,
    );

    return {
      message:
        language === 'fi'
          ? 'Salasana paivitettiin onnistuneesti.'
          : 'Password updated successfully',
    };
  }
}
