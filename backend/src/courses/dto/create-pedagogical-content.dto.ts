import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ContentType } from '../../entities/content-type.enum';

export class CreatePedagogicalContentDto {
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @IsString()
  @IsNotEmpty()
  titleFi: string;

  @IsEnum(ContentType)
  @IsNotEmpty()
  type: ContentType;

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
  @IsNotEmpty()
  orderIndex: number;
}
