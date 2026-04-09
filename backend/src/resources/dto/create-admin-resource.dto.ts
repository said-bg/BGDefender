import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ResourceType } from '../../entities/resource.entity';

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
  fileUrl?: string;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  assignedUserId!: number;
}
