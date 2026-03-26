import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateChapterDto {
  @IsString()
  @IsOptional()
  titleEn?: string;

  @IsString()
  @IsOptional()
  titleFi?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsString()
  @IsOptional()
  descriptionFi?: string;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}
