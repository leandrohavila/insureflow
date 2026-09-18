import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  MinLength,
  ValidateIf,
} from 'class-validator';

import { optionalEmptyValue } from '../../../common/dto/optional-value.util';

export const REACTIVATION_QUEUE_WINDOWS = [
  'today',
  'overdue',
  'next7',
] as const;

export type ReactivationQueueWindow =
  (typeof REACTIVATION_QUEUE_WINDOWS)[number];

export class ListReactivationQueueQueryDto {
  @ApiPropertyOptional({ enum: REACTIVATION_QUEUE_WINDOWS })
  @IsOptional()
  @IsIn(REACTIVATION_QUEUE_WINDOWS)
  window?: ReactivationQueueWindow;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lossReasonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessUnitId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class ReactivateLeadDto {
  @ApiPropertyOptional({
    example: 'contacted',
    description: 'Status ativo no funil (default: contacted)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['new', 'contacted', 'qualified'])
  toStatus?: string;

  @ApiPropertyOptional({
    description: 'Data/hora do próximo contato (default: +1 dia)',
  })
  @IsOptional()
  @IsDateString()
  nextContactAt?: string;

  @ApiPropertyOptional({ enum: ['CALL', 'WHATSAPP', 'EMAIL', 'MEETING'] })
  @IsOptional()
  @IsIn(['CALL', 'WHATSAPP', 'EMAIL', 'MEETING'])
  nextContactType?: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING';

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class PostponeReactivationDto {
  @ApiPropertyOptional({ enum: [7, 15, 30] })
  @ValidateIf((o: PostponeReactivationDto) => !o.at)
  @Type(() => Number)
  @IsInt()
  @IsIn([7, 15, 30])
  days?: number;

  @ApiPropertyOptional({ description: 'Data personalizada (ISO)' })
  @ValidateIf((o: PostponeReactivationDto) => o.days == null)
  @IsDateString()
  at?: string;

  @ApiProperty({ description: 'Motivo do adiamento' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}
