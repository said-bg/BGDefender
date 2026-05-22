import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminOrCreatorRoleGuard } from '../auth/guards/admin-or-creator-role.guard';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { CertificateSigner } from '../entities/certificate-signer.entity';
import { Course } from '../entities/course.entity';
import { CertificateSignersController } from './controllers/certificate-signers.controller';
import { CertificateSignersService } from './services/certificate-signers.service';

@Module({
  imports: [TypeOrmModule.forFeature([CertificateSigner, Course])],
  controllers: [CertificateSignersController],
  providers: [
    CertificateSignersService,
    AdminRoleGuard,
    AdminOrCreatorRoleGuard,
  ],
  exports: [CertificateSignersService],
})
export class CertificateSignersModule {}
