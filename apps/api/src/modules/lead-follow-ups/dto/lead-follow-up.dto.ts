import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  FOLLOW_UP_STATUSES,
  FOLLOW_UP_TYPES,
} from '../../../common/constants/interest-categories';
import { LIST_QUERY_MAX_LIMIT } from '../../../common/dto/pagination.constants';
import { optionalEmptyValue } from '../../../common/dto/optional-value.util';

export const FOLLOW_UP_WINDOWS = ['today', 'overdue', 'next7'] as const;

export class ListLeadFollowUpsQueryDto {
  @ApiPropertyOptional({ enum: FOLLOW_UP_WINDOWS })
  @IsOptional()
  @IsIn(FOLLOW_UP_WINDOWS)
  window?: (typeof FOLLOW_UP_WINDOWS)[number];

  @ApiPropertyOptional({ enum: FOLLOW_UP_STATUSES })
  @IsOptional()
  @IsIn(FOLLOW_UP_STATUSES)
  status?: (typeof FOLLOW_UP_STATUSES)[number];

  @ApiPropertyOptional({ enum: FOLLOW_UP_TYPES })
  @IsOptional()
  @IsIn(FOLLOW_UP_TYPES)
  type?: (typeof FOLLOW_UP_TYPES)[number];

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
  leadId?: string;

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

export class CreateLeadFollowUpDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  leadId!: string;

  @ApiProperty({ example: '2026-08-23T12:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiProperty({ enum: FOLLOW_UP_TYPES, example: 'WHATSAPP' })
  @IsIn(FOLLOW_UP_TYPES)
  type!: (typeof FOLLOW_UP_TYPES)[number];

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  assignedUserId?: string;
}

export class UpdateLeadFollowUpDto extends PartialType(CreateLeadFollowUpDto) {
  @ApiPropertyOptional({ enum: FOLLOW_UP_STATUSES })
  @IsOptional()
  @IsIn(FOLLOW_UP_STATUSES)
  status?: (typeof FOLLOW_UP_STATUSES)[number];
}
