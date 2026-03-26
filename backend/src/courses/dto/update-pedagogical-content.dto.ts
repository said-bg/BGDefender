import { IsEnum, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { ContentType } from '../../entities/content-type.enum';

export class UpdatePedagogicalContentDto {
  @IsString()
  @IsOptional()
  titleEn?: string;

  @IsString()
  @IsOptional()
  titleFi?: string;

  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

  @IsString()
  @IsOptional()
  contentEn?: string;

  @IsString()
  @IsOptional()
  contentFi?: string;

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}
