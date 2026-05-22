import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { CertificatesService } from '../services/certificates.service';

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('me')
  async listMyCertificates(@CurrentUser() currentUser: SafeUser) {
    return this.certificatesService.listMyCertificates(currentUser.id);
  }

  @Get('me/:id')
  async getMyCertificate(
    @CurrentUser() currentUser: SafeUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.certificatesService.getMyCertificate(currentUser.id, id);
  }

  @Get('me/:id/pdf')
  async getMyCertificatePdf(
    @CurrentUser() currentUser: SafeUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('lang') language: string | undefined,
    @Res() response: Response,
  ) {
    const pdf = await this.certificatesService.getMyCertificatePdf(
      currentUser.id,
      id,
      language,
    );

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${pdf.filename}"`,
    );
    response.send(pdf.buffer);
  }
}
