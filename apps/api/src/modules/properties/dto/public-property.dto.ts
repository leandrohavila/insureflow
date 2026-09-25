import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  PROPERTY_PURPOSES,
  PROPERTY_TYPES,
  type PropertyPurpose,
  type PropertyType,
} from '../properties.util';

export class PublicPropertyQueryDto {
  @ApiProperty({ example: 'insureflow' })
  @IsString()
  @MaxLength(80)
  tenantSlug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  businessUnitSlug?: string;

  @ApiPropertyOptional({ example: 'Cuiabá' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  neighborhood?: string;

  @ApiPropertyOptional({ enum: PROPERTY_PURPOSES })
  @IsOptional()
  @IsIn(PROPERTY_PURPOSES)
  purpose?: PropertyPurpose;

  @ApiPropertyOptional({
    enum: ['buy', 'rent'],
    description: 'Compra (venda) ou locação, incluindo imóveis venda e locação',
  })
  @IsOptional()
  @IsIn(['buy', 'rent'])
  purposeMode?: 'buy' | 'rent';

  @ApiPropertyOptional({ enum: PROPERTY_TYPES })
  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  type?: PropertyType;

  @ApiPropertyOptional({ description: 'Código público (slug) ou id do imóvel' })
  @IsOptional()
  @IsString()
  @MaxLength(88)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isLaunch?: boolean;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ example: 800000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 12, default: 12, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}

export class PublicPropertySearchQueryDto extends PublicPropertyQueryDto {
  @ApiPropertyOptional({
    description: 'Busca textual (título, descrição, cidade, bairro)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
