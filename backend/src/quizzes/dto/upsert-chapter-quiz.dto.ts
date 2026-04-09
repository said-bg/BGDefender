import { Type, Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuizQuestionType } from '../../entities/quiz-question-type.enum';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOptionalString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const toNumber = ({ value }: { value: unknown }): number => Number(value);

const toBoolean = ({ value }: { value: unknown }): boolean =>
  value === true || value === 'true';

export class UpsertQuizOptionDto {
  @Transform(trimString)
  @IsString()
  @MaxLength(220)
  labelEn!: string;

  @Transform(trimString)
  @IsString()
  @MaxLength(220)
  labelFi!: string;

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  orderIndex!: number;

  @Transform(toBoolean)
  @IsBoolean()
  isCorrect!: boolean;
}

export class UpsertQuizQuestionDto {
  @Transform(trimString)
  @IsString()
  @MaxLength(300)
  promptEn!: string;

  @Transform(trimString)
  @IsString()
  @MaxLength(300)
  promptFi!: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  explanationEn?: string | null;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  explanationFi?: string | null;

  @IsEnum(QuizQuestionType)
  type!: QuizQuestionType;

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  orderIndex!: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => UpsertQuizOptionDto)
  options!: UpsertQuizOptionDto[];
}

export class UpsertChapterQuizDto {
  @Transform(trimString)
  @IsString()
  @MaxLength(200)
  titleEn!: string;

  @Transform(trimString)
  @IsString()
  @MaxLength(200)
  titleFi!: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  descriptionEn?: string | null;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  descriptionFi?: string | null;

  @Transform(toNumber)
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore!: number;

  @Transform(toBoolean)
  @IsBoolean()
  isPublished!: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertQuizQuestionDto)
  questions!: UpsertQuizQuestionDto[];
}
