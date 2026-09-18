import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { optionalEmptyValue } from '../../../common/dto/optional-value.util';
import {
  BUSINESS_UNIT_TYPES,
  type BusinessUnitType,
} from '../../../common/constants/interest-categories';

export class ListBusinessUnitsQueryDto {
  @ApiPropertyOptional({ enum: BUSINESS_UNIT_TYPES })
  @IsOptional()
  @IsIn(BUSINESS_UNIT_TYPES)
  type?: BusinessUnitType;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  active?: boolean;
}

export class CreateBusinessUnitDto {
  @ApiProperty({ example: 'Corretora Ávila' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: 'corretora-avila' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @ApiProperty({ enum: BUSINESS_UNIT_TYPES, example: 'INSURANCE' })
  @IsIn(BUSINESS_UNIT_TYPES)
  type!: BusinessUnitType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBusinessUnitDto extends PartialType(CreateBusinessUnitDto) {}

export class LinkBusinessUnitDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  businessUnitId!: string;
}

export class UpdateBusinessUnitContextDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'ID da empresa ativa. null = Todas.',
  })
  @Transform(({ value }) => (value === '' ? null : value))
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(40)
  businessUnitId?: string | null;
}
