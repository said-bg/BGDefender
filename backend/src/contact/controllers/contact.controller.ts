import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { resolveLanguage } from '../../config/request-language';
import { EmailService } from '../../email/email.service';
import { ContactRequestDto } from '../dto/contact-request.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
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
