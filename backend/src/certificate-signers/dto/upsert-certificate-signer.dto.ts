import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { CertificateSignerRole } from '../../entities/certificate-signer.entity';

const pngDataUrlPattern = /^data:image\/png;base64,/;

export class UpsertCertificateSignerDto {
  @IsString()
  @MaxLength(160)
  fullName!: string;

  @IsEnum(CertificateSignerRole)
  role!: CertificateSignerRole;

  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @Matches(pngDataUrlPattern, {
    message: 'signatureData must be a PNG data URL',
  })
  signatureData!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
