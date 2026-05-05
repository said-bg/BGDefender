import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { safeAssetUrlPattern } from '../../uploads/upload-security.utils';

export class UpdateCourseCollectionDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  titleEn?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  titleFi?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string | null;

  @IsString()
  @IsOptional()
  descriptionFi?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Matches(safeAssetUrlPattern, {
    message: 'coverImage must be an http(s) URL or a trusted local asset path',
  })
  coverImage?: string | null;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  orderIndex?: number;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  courseIds?: string[];
}
