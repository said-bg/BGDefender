import { IsString, IsOptional, Matches, MaxLength } from 'class-validator';
import { safeAssetUrlPattern } from '../../security/upload-security.utils';

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
  @MaxLength(2048)
  @Matches(safeAssetUrlPattern, {
    message: 'photo must be an http(s) URL or a trusted local asset path',
  })
  photo?: string;
}
