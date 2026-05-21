import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOptionalString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const toNumberArray = ({ value }: { value: unknown }): number[] =>
  Array.isArray(value) ? value.map((entry) => Number(entry)) : [];

export class UpdateResourceGroupDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  description?: string | null;

  @IsOptional()
  @Transform(toNumberArray)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  memberUserIds?: number[];
}
