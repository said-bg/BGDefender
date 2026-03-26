import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateAuthorDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  biography?: string;

  @IsString()
  @IsOptional()
  photo?: string;
}
