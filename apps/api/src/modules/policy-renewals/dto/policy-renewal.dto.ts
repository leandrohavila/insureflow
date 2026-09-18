import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { COMMERCIAL_RENEWAL_STATUSES } from '../../../common/constants/interest-categories';
import { LIST_QUERY_MAX_LIMIT } from '../../../common/dto/pagination.constants';
import { optionalEmptyValue } from '../../../common/dto/optional-value.util';

export class ListPolicyRenewalsQueryDto {
  @ApiPropertyOptional({ enum: COMMERCIAL_RENEWAL_STATUSES })
  @IsOptional()
  @IsIn(COMMERCIAL_RENEWAL_STATUSES)
  status?: (typeof COMMERCIAL_RENEWAL_STATUSES)[number];

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
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  product?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  insurer?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @ApiPropertyOptional({ description: 'Vence em N dias (30/60/90).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  dueInDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

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

export class CreatePolicyRenewalDto {
  @ApiProperty({ description: 'ID do cliente (customerId)' })
  @IsString()
  @MaxLength(40)
  clientId!: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @MaxLength(80)
  policyNumber!: string;

  @ApiProperty({ example: 'Porto Seguro' })
  @IsString()
  @MaxLength(120)
  insurer!: string;

  @ApiProperty({ example: 'Seguro Auto' })
  @IsString()
  @MaxLength(160)
  product!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @ApiPropertyOptional({ enum: COMMERCIAL_RENEWAL_STATUSES })
  @IsOptional()
  @IsIn(COMMERCIAL_RENEWAL_STATUSES)
  status?: (typeof COMMERCIAL_RENEWAL_STATUSES)[number];

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
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  policyId?: string;
}

export class UpdatePolicyRenewalDto extends PartialType(CreatePolicyRenewalDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  convertedRevenue?: number;
}
