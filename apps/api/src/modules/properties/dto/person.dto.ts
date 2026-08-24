import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { PERSON_KINDS, type PersonKind } from '../properties.util';

export class ListPersonsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

export class CreatePersonDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ enum: PERSON_KINDS, default: 'INDIVIDUAL' })
  @IsOptional()
  @IsIn(PERSON_KINDS)
  kind?: PersonKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  document?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Cliente CRM opcional do mesmo tenant' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerId?: string;
}

export class UpdatePersonDto extends PartialType(CreatePersonDto) {}
