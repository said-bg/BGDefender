import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage?: number = 0;
}
