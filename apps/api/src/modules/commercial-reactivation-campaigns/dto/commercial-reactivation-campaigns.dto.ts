import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { optionalEmptyValue } from '../../../common/dto/optional-value.util';

export const CAMPAIGN_STATUSES = ['DRAFT', 'IN_PROGRESS', 'FINISHED'] as const;

export const CAMPAIGN_LEAD_CONTACT_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'NO_RESPONSE',
  'INTERESTED',
  'REACTIVATED',
  'CLOSED',
] as const;

export const LOST_DAYS_PRESETS = [30, 60, 90, 180] as const;

export class ListCampaignsQueryDto {
  @ApiPropertyOptional({ enum: CAMPAIGN_STATUSES })
  @IsOptional()
  @IsIn(CAMPAIGN_STATUSES)
  status?: (typeof CAMPAIGN_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerUserId?: string;

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

export class CreateCampaignDto {
  @ApiProperty({ example: 'Reativação Q3 — Sem retorno' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Responsável da campanha (default: usuário atual)',
  })
  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessUnitId?: string;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerUserId?: string;
}

export class PreviewCampaignLeadsDto {
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
  ownerUserId?: string;

  @ApiPropertyOptional({ description: 'Filtro textual em Lead.company' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessUnitId?: string;

  @ApiPropertyOptional({ enum: LOST_DAYS_PRESETS })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([...LOST_DAYS_PRESETS])
  lostDays?: number;
}

export class AddCampaignLeadsDto extends PreviewCampaignLeadsDto {
  @ApiPropertyOptional({
    description: 'IDs explícitos (se omitido, usa filtros)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  leadIds?: string[];
}

export class UpdateCampaignLeadDto {
  @ApiPropertyOptional({ enum: CAMPAIGN_LEAD_CONTACT_STATUSES })
  @IsOptional()
  @IsIn(CAMPAIGN_LEAD_CONTACT_STATUSES)
  contactStatus?: (typeof CAMPAIGN_LEAD_CONTACT_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ReactivateCampaignLeadDto {
  @ApiPropertyOptional({ enum: ['new', 'contacted', 'qualified'] })
  @IsOptional()
  @IsIn(['new', 'contacted', 'qualified'])
  toStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
