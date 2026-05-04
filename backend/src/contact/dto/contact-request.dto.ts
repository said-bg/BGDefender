import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export enum ContactRequestType {
  GENERAL = 'general',
  SUPPORT = 'support',
  CREATOR = 'creator',
  PREMIUM = 'premium',
}

export class ContactRequestDto {
  @IsEnum(ContactRequestType)
  requestType!: ContactRequestType;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @Transform(trimString)
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(160)
  email!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;
}
