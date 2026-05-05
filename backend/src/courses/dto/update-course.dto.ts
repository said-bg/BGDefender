import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { CourseLevel, CourseStatus } from '../../entities/course.entity';
import { safeAssetUrlPattern } from '../../uploads/upload-security.utils';

export class UpdateCourseDto {
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
  descriptionEn?: string;

  @IsString()
  @IsOptional()
  descriptionFi?: string;

  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;

  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  estimatedDuration?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  @Matches(safeAssetUrlPattern, {
    message: 'coverImage must be an http(s) URL or a trusted local asset path',
  })
  coverImage?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  authorIds?: string[];
}
