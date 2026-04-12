import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

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
