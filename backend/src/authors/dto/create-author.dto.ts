import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateAuthorDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  biography?: string;

  @IsString()
  @IsOptional()
  photo?: string;
}
