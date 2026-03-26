import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateAuthorDto {
  @IsString()
  @MaxLength(100)
  name: string;

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
