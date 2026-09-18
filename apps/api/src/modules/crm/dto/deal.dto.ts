import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export const CRM_DEAL_STAGES = [
  'novo',
  'qualificacao',
  'contato',
  'cotacao',
  'visita',
  'proposta',
  'negociacao',
  'contrato',
  'fechamento',
  'fechado',
] as const;

export const CRM_DEAL_STATUSES = ['open', 'won', 'lost', 'archived'] as const;

export type CrmDealStage = (typeof CRM_DEAL_STAGES)[number];

export type CrmDealStatus = (typeof CRM_DEAL_STATUSES)[number];

export class ListDealsQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 50,
    minimum: 1,
    maximum: LIST_QUERY_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIST_QUERY_MAX_LIMIT)
  limit?: number;
}

export class CreateDealDto {
  @ApiProperty({ example: 'Frota corporativa' })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'Transportes Sul' })
  @IsString()
  @MaxLength(160)
  company!: string;

  @ApiProperty({ example: 67000, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value!: number;

  @ApiProperty({
    example: 'negociacao',

    enum: CRM_DEAL_STAGES,

    default: 'novo',
  })
  @IsIn(CRM_DEAL_STAGES)
  stage!: CrmDealStage;

  @ApiProperty({
    example: 'open',

    enum: CRM_DEAL_STATUSES,

    default: 'open',
  })
  @IsIn(CRM_DEAL_STATUSES)
  status!: CrmDealStatus;

  @ApiPropertyOptional({
    example: 'user_cuid_or_owner_name',

    description: 'Usuário responsável (id ou identificador externo).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignedTo?: string;

  @ApiPropertyOptional({
    example: 1500,

    description:
      'Ordem manual no Kanban (fractional indexing). Omitir no POST — o backend atribui automaticamente.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pipelineOrder?: number;

  @ApiPropertyOptional({ description: 'Unidade de negócio do oportunidade.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional({
    enum: ['LEAD', 'RENEWAL', 'CROSS_SELL', 'MANUAL', 'REACTIVATION'],
  })
  @IsOptional()
  @IsIn(['LEAD', 'RENEWAL', 'CROSS_SELL', 'MANUAL', 'REACTIVATION'])
  sourceType?: 'LEAD' | 'RENEWAL' | 'CROSS_SELL' | 'MANUAL' | 'REACTIVATION';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sourceId?: string;

  @ApiPropertyOptional({
    enum: ['AUTO', 'VIDA', 'EMPRESARIAL', 'RESIDENCIAL', 'VENDA', 'LOCACAO'],
  })
  @IsOptional()
  @IsIn(['AUTO', 'VIDA', 'EMPRESARIAL', 'RESIDENCIAL', 'VENDA', 'LOCACAO'])
  productType?: string;
}

/** PATCH parcial — campos explícitos para whitelist estável no ValidationPipe. */

export class UpdateDealDto {
  @ApiPropertyOptional({ example: 'Frota corporativa' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ example: 'Transportes Sul' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @ApiPropertyOptional({ example: 67000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ example: 'negociacao', enum: CRM_DEAL_STAGES })
  @IsOptional()
  @IsIn(CRM_DEAL_STAGES)
  stage?: CrmDealStage;

  @ApiPropertyOptional({ example: 'open', enum: CRM_DEAL_STATUSES })
  @IsOptional()
  @IsIn(CRM_DEAL_STATUSES)
  status?: CrmDealStatus;

  @ApiPropertyOptional({
    example: 'user_cuid_or_owner_name',

    description: 'Usuário responsável (id ou identificador externo).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignedTo?: string;

  @ApiPropertyOptional({
    example: 1500,

    description: 'Ordem manual no Kanban (fractional indexing).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pipelineOrder?: number;

  @ApiPropertyOptional({ description: 'Unidade de negócio do oportunidade.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional({
    enum: ['AUTO', 'VIDA', 'EMPRESARIAL', 'RESIDENCIAL', 'VENDA', 'LOCACAO'],
  })
  @IsOptional()
  @IsIn(['AUTO', 'VIDA', 'EMPRESARIAL', 'RESIDENCIAL', 'VENDA', 'LOCACAO'])
  productType?: string;
}
