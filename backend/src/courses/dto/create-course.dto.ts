import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { CourseLevel, CourseStatus } from '../../entities/course.entity';
import { safeAssetUrlPattern } from '../../security/upload-security.utils';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titleEn: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titleFi: string;

  @IsString()
  @IsNotEmpty()
  descriptionEn: string;

  @IsString()
  @IsNotEmpty()
  descriptionFi: string;

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
