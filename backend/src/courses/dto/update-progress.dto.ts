import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ProgressViewType } from '../../entities/progress.entity';

export class UpdateProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  completionPercentage?: number;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsEnum(ProgressViewType)
  @IsOptional()
  lastViewedType?: ProgressViewType;

  @IsUUID()
  @IsOptional()
  lastChapterId?: string;

  @IsUUID()
  @IsOptional()
  lastSubChapterId?: string;
}
