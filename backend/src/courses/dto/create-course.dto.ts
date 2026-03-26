import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CourseLevel, CourseStatus } from '../../entities/course.entity';

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
  coverImage?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  authorIds?: string[];
}
