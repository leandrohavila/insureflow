import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Allow,
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  FEATURE_VALUE_TYPES,
  type FeatureValueType,
} from '../properties.util';

export class CreatePropertyFeatureDefinitionDto {
  @ApiPropertyOptional({ example: 'piscina' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  key?: string;

  @ApiProperty({ example: 'Piscina' })
  @IsString()
  @MaxLength(80)
  label!: string;

  @ApiPropertyOptional({ enum: FEATURE_VALUE_TYPES, default: 'BOOLEAN' })
  @IsOptional()
  @IsIn(FEATURE_VALUE_TYPES)
  valueType?: FeatureValueType;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePropertyFeatureDefinitionDto extends PartialType(
  CreatePropertyFeatureDefinitionDto,
) {}

export class PropertyFeatureValueDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  definitionId!: string;

  @ApiPropertyOptional({
    description: 'boolean | string | number conforme valueType da definição',
    nullable: true,
  })
  @IsOptional()
  @Allow()
  value?: boolean | string | number | null;
}

export class ReplacePropertyFeaturesDto {
  @ApiProperty({ type: [PropertyFeatureValueDto] })
  @IsArray()
  @ArrayMaxSize(80)
  @ValidateNested({ each: true })
  @Type(() => PropertyFeatureValueDto)
  items!: PropertyFeatureValueDto[];
}

export class ReorderPropertyImagesDto {
  @ApiProperty({ type: [String], description: 'IDs na ordem desejada' })
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  imageIds!: string[];
}
