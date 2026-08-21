import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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

import { LIST_QUERY_MAX_LIMIT } from '../../../common/dto/pagination.constants';
import {
  COMMISSION_PRODUCT_TYPES,
  COMMISSION_STATUSES,
} from '../../../common/utils/sales-commission.util';

export class ListSalesTargetsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  teamId?: string;
}

export class CreateSalesTargetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  teamId?: string;

  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetDeals?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  targetRevenue?: number;
}

export class UpdateSalesTargetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetDeals?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  targetRevenue?: number;
}

export class ListCommissionsQueryDto {
  @ApiPropertyOptional({ enum: COMMISSION_STATUSES })
  @IsOptional()
  @IsIn([...COMMISSION_STATUSES])
  status?: (typeof COMMISSION_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIST_QUERY_MAX_LIMIT)
  limit?: number;
}

export class UpdateCommissionDto {
  @ApiProperty({ enum: COMMISSION_STATUSES })
  @IsIn(['APPROVED', 'PAID', 'CANCELLED'])
  status!: 'APPROVED' | 'PAID' | 'CANCELLED';
}

export class CreateCommissionRuleDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  businessUnitId!: string;

  @ApiProperty({ enum: COMMISSION_PRODUCT_TYPES })
  @IsIn([...COMMISSION_PRODUCT_TYPES])
  productType!: (typeof COMMISSION_PRODUCT_TYPES)[number];

  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  commissionPercentage!: number;
}

export class UpdateCommissionRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  commissionPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PerformanceQueryDto {
  @ApiPropertyOptional({ enum: ['month', 'quarter', 'year'] })
  @IsOptional()
  @IsIn(['month', 'quarter', 'year'])
  period?: 'month' | 'quarter' | 'year';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  userId?: string;

  @ApiPropertyOptional({ enum: ['broker', 'team', 'company'] })
  @IsOptional()
  @IsIn(['broker', 'team', 'company'])
  groupBy?: 'broker' | 'team' | 'company';
}
