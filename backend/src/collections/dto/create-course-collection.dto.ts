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
import { safeAssetUrlPattern } from '../../security/upload-security.utils';

export class CreateCourseCollectionDto {
  @IsString()
  @MaxLength(200)
  titleEn!: string;

  @IsString()
  @MaxLength(200)
  titleFi!: string;

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
