import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { resolveLanguage } from '../../config/request-language';
import { EmailService } from '../../email/email.service';
import { ContactRequestDto } from '../dto/contact-request.dto';
import { RateLimit } from '../../security/rate-limit.decorator';
import { RateLimitGuard } from '../../security/rate-limit.guard';

@Controller('contact')
export class ContactController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'contact:submit', maxRequests: 3, windowMs: 15 * 60_000 })
  async submitContactRequest(
    @Body() contactRequestDto: ContactRequestDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ message: string }> {
    const language = resolveLanguage(acceptLanguage);

    await this.emailService.sendContactEmail({
      ...contactRequestDto,
      language,
    });

    return {
      message:
        language === 'fi'
          ? 'Viestisi on lähetetty. Otamme sinuun yhteyttä sähköpostitse.'
          : 'Your message has been sent. We will get back to you by email.',
    };
  }
}
