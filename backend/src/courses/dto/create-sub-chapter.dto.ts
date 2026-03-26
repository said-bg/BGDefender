import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSubChapterDto {
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @IsString()
  @IsNotEmpty()
  titleFi: string;

  @IsString()
  @IsNotEmpty()
  descriptionEn: string;

  @IsString()
  @IsNotEmpty()
  descriptionFi: string;

  @IsNumber()
  @IsNotEmpty()
  orderIndex: number;
}
