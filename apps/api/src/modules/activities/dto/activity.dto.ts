import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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

export const ACTIVITY_TYPES = [
  'call',
  'whatsapp',
  'email',
  'meeting',
  'visit',
  'note',
  'follow_up',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_STATUSES = ['pending', 'completed', 'cancelled'] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export class ListActivitiesQueryDto {
  @ApiPropertyOptional({ enum: ACTIVITY_STATUSES })
  @IsOptional()
  @IsIn(ACTIVITY_STATUSES)
  status?: ActivityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dealId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ enum: ACTIVITY_TYPES })
  @IsOptional()
  @IsIn(ACTIVITY_TYPES)
  type?: ActivityType;

  @ApiPropertyOptional({
    description: 'Início do intervalo de occurredAt (ISO).',
  })
  @IsOptional()
  @IsDateString()
  occurredAtFrom?: string;

  @ApiPropertyOptional({ description: 'Fim do intervalo de occurredAt (ISO).' })
  @IsOptional()
  @IsDateString()
  occurredAtTo?: string;

  @ApiPropertyOptional({
    description: 'Início do intervalo de nextFollowUpAt (ISO).',
  })
  @IsOptional()
  @IsDateString()
  nextFollowUpFrom?: string;

  @ApiPropertyOptional({
    description: 'Fim do intervalo de nextFollowUpAt (ISO).',
  })
  @IsOptional()
  @IsDateString()
  nextFollowUpTo?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateActivityDto {
  @ApiProperty({ enum: ACTIVITY_TYPES })
  @IsIn(ACTIVITY_TYPES)
  type!: ActivityType;

  @ApiPropertyOptional({ enum: ACTIVITY_STATUSES, default: 'pending' })
  @IsOptional()
  @IsIn(ACTIVITY_STATUSES)
  status?: ActivityStatus;

  @ApiProperty({ example: 'Ligação de qualificação' })
  @IsString()
  @MaxLength(200)
  subject!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  outcome?: string;

  @ApiProperty({ example: '2026-05-20T14:30:00.000Z' })
  @IsDateString()
  occurredAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dealId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Apólice operacional vinculada ao evento.',
  })
  @IsOptional()
  @IsString()
  policyId?: string;
}

export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
