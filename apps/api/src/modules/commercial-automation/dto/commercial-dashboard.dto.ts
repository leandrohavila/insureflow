import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { optionalEmptyValue } from '../../../common/dto/optional-value.util';

export class CommercialDashboardQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-20T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  userId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  teamId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;
}
