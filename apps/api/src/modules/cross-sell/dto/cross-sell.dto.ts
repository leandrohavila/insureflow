import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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
import { CROSS_SELL_STATUSES } from '../../../common/constants/interest-categories';

export class ListCrossSellQueryDto {
  @ApiPropertyOptional({ enum: CROSS_SELL_STATUSES })
  @IsOptional()
  @IsIn(CROSS_SELL_STATUSES)
  status?: (typeof CROSS_SELL_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerId?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    minimum: 1,
    maximum: LIST_QUERY_MAX_LIMIT,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIST_QUERY_MAX_LIMIT)
  limit?: number = 20;
}

export class UpdateCrossSellOpportunityDto {
  @ApiPropertyOptional({ enum: CROSS_SELL_STATUSES })
  @IsOptional()
  @IsIn(CROSS_SELL_STATUSES)
  status?: (typeof CROSS_SELL_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  convertedDealId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  convertedRevenue?: number;
}
