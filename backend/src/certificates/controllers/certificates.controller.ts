import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
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
}
