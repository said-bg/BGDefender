import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  completionPercentage?: number;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
