import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { CRM_DEAL_STAGES, type CrmDealStage } from '../../crm/dto/deal.dto';

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export class ListLeadsQueryDto {
  @ApiPropertyOptional({
    example: 'marina',
    description:
      'Busca por nome, email, telefone, empresa, origem ou responsável.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: LEAD_STATUSES })
  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: LeadStatus;

  @ApiPropertyOptional({ example: 'whatsapp' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class CreateLeadDto {
  @ApiProperty({ example: 'Marina Costa' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: 'marina@email.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: 'Transportes Sul' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @ApiPropertyOptional({ example: 'whatsapp' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;

  @ApiProperty({ example: 'new', enum: LEAD_STATUSES, default: 'new' })
  @IsIn(LEAD_STATUSES)
  status!: LeadStatus;

  @ApiPropertyOptional({ example: 'Interessado em seguro residencial.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ example: 'Ana Costa' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignedTo?: string;
}

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}

export class ConvertLeadDto {
  @ApiPropertyOptional({ example: 'Seguro residencial — Marina Costa' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ example: 12000, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value?: number;

  @ApiPropertyOptional({
    example: 'novo',
    enum: CRM_DEAL_STAGES,
    default: 'novo',
  })
  @IsOptional()
  @IsIn(CRM_DEAL_STAGES)
  stage?: CrmDealStage;

  @ApiPropertyOptional({ example: 'Ana Costa' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignedTo?: string;
}
