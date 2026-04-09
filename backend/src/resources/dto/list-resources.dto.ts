import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ResourceSource, ResourceType } from '../../entities/resource.entity';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toNumber = ({ value }: { value: unknown }): number => Number(value);

export class ListResourcesDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  assignedUserId?: number;

  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @IsOptional()
  @IsEnum(ResourceSource)
  source?: ResourceSource;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 25;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
