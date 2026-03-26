import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateAuthorDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  roleEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  roleFi?: string;

  @IsString()
  @IsOptional()
  biographyEn?: string;

  @IsString()
  @IsOptional()
  biographyFi?: string;

  @IsString()
  @IsOptional()
  photo?: string;
}
