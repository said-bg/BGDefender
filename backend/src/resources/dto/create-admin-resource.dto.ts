import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ResourceType } from '../../entities/resource.entity';
import { safeResourceUploadUrlPattern } from '../../security/upload-security.utils';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOptionalString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const toNumber = ({ value }: { value: unknown }): number => Number(value);

export class CreateAdminResourceDto {
  @Transform(trimString)
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  description?: string | null;

  @IsEnum(ResourceType)
  type!: ResourceType;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(safeResourceUploadUrlPattern, {
    message: 'fileUrl must point to a trusted uploaded resource path',
  })
  fileUrl?: string;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
  })
  @MaxLength(2048)
  linkUrl?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  assignedUserId?: number;

  @IsOptional()
  @IsUUID()
  assignedGroupId?: string;
}
