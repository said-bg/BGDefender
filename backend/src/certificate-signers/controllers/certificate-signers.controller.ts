import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminOrCreatorRoleGuard } from '../../auth/guards/admin-or-creator-role.guard';
import { AdminRoleGuard } from '../../auth/guards/admin-role.guard';
import { CertificateSignerRole } from '../../entities/certificate-signer.entity';
import { UpdateSignerCourseAssignmentsDto } from '../dto/update-signer-course-assignments.dto';
import { UpsertCertificateSignerDto } from '../dto/upsert-certificate-signer.dto';
import { CertificateSignersService } from '../services/certificate-signers.service';

@Controller('certificate-signers')
@UseGuards(JwtAuthGuard)
export class CertificateSignersController {
  constructor(
    private readonly certificateSignersService: CertificateSignersService,
  ) {}

  @Get('options')
  @UseGuards(AdminOrCreatorRoleGuard)
  async getOptions() {
    return await this.certificateSignersService.getOptions();
  }

  @Get('admin')
  @UseGuards(AdminRoleGuard)
  async listAll(@Query('role') role?: CertificateSignerRole) {
    return await this.certificateSignersService.listAll(role);
  }

  @Post('admin')
  @UseGuards(AdminRoleGuard)
  async create(@Body() body: UpsertCertificateSignerDto) {
    return await this.certificateSignersService.create(body);
  }

  @Put('admin/:id')
  @UseGuards(AdminRoleGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpsertCertificateSignerDto,
  ) {
    return await this.certificateSignersService.update(id, body);
  }

  @Get('admin/:id/course-assignments')
  @UseGuards(AdminRoleGuard)
  async getCourseAssignments(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.certificateSignersService.getCourseAssignments(id);
  }

  @Put('admin/:id/course-assignments')
  @UseGuards(AdminRoleGuard)
  async updateCourseAssignments(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateSignerCourseAssignmentsDto,
  ) {
    return await this.certificateSignersService.updateCourseAssignments(id, body);
  }

  @Delete('admin/:id')
  @UseGuards(AdminRoleGuard)
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.certificateSignersService.delete(id);
    return { success: true };
  }
}
