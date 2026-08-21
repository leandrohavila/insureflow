import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { LIST_QUERY_MAX_LIMIT } from '../../../common/dto/pagination.constants';
import { optionalEmptyValue } from '../../../common/dto/optional-value.util';
import {
  OPPORTUNITY_SCORES,
  OPPORTUNITY_SOURCES,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
} from '../../../common/utils/opportunity-engine.util';

export class ListOpportunitiesQueryDto {
  @ApiPropertyOptional({ enum: OPPORTUNITY_TYPES })
  @IsOptional()
  @IsIn(OPPORTUNITY_TYPES)
  type?: (typeof OPPORTUNITY_TYPES)[number];

  @ApiPropertyOptional({ enum: OPPORTUNITY_STATUSES })
  @IsOptional()
  @IsIn(OPPORTUNITY_STATUSES)
  status?: (typeof OPPORTUNITY_STATUSES)[number];

  @ApiPropertyOptional({ enum: OPPORTUNITY_SCORES })
  @IsOptional()
  @IsIn(OPPORTUNITY_SCORES)
  score?: (typeof OPPORTUNITY_SCORES)[number];

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  assignedUserId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(LIST_QUERY_MAX_LIMIT)
  limit?: number = 20;
}

export class CreateOpportunityDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  customerId!: string;

  @ApiProperty({ enum: OPPORTUNITY_TYPES })
  @IsIn(OPPORTUNITY_TYPES)
  type!: (typeof OPPORTUNITY_TYPES)[number];

  @ApiPropertyOptional({ enum: OPPORTUNITY_STATUSES })
  @IsOptional()
  @IsIn(OPPORTUNITY_STATUSES)
  status?: (typeof OPPORTUNITY_STATUSES)[number];

  @ApiPropertyOptional({ enum: OPPORTUNITY_SOURCES })
  @IsOptional()
  @IsIn(OPPORTUNITY_SOURCES)
  source?: (typeof OPPORTUNITY_SOURCES)[number];

  @ApiPropertyOptional({ enum: OPPORTUNITY_SCORES })
  @IsOptional()
  @IsIn(OPPORTUNITY_SCORES)
  score?: (typeof OPPORTUNITY_SCORES)[number];

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  assignedUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  originType?: string;
}

export class UpdateOpportunityDto {
  @ApiPropertyOptional({ enum: OPPORTUNITY_STATUSES })
  @IsOptional()
  @IsIn(OPPORTUNITY_STATUSES)
  status?: (typeof OPPORTUNITY_STATUSES)[number];

  @ApiPropertyOptional({ enum: OPPORTUNITY_SCORES })
  @IsOptional()
  @IsIn(OPPORTUNITY_SCORES)
  score?: (typeof OPPORTUNITY_SCORES)[number];

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  assignedUserId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  convertedDealId?: string;
}

export class Dashboard360QueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  userId?: string;
}
