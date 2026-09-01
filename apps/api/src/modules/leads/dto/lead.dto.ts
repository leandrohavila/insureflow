import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
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

import { INTEREST_CATEGORIES } from '../../../common/constants/interest-categories';

import { LIST_QUERY_MAX_LIMIT } from '../../../common/dto/pagination.constants';
import { optionalEmptyValue } from '../../../common/dto/optional-value.util';
import { LEAD_DOCUMENT_TYPES } from '../../../common/utils/document.util';
import { CRM_DEAL_STAGES, type CrmDealStage } from '../../crm/dto/deal.dto';

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_OPPORTUNITY_TYPES = [
  'new_business',
  'renewal',
  'cross_sell',
  'indication',
] as const;

export type LeadOpportunityType = (typeof LEAD_OPPORTUNITY_TYPES)[number];

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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    minimum: 1,
    maximum: LIST_QUERY_MAX_LIMIT,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIST_QUERY_MAX_LIMIT)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar apenas leads do usuário autenticado (responsável).',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  mine?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar por unidade de negócio.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional({ enum: INTEREST_CATEGORIES })
  @IsOptional()
  @IsIn(INTEREST_CATEGORIES)
  interestCategory?: (typeof INTEREST_CATEGORIES)[number];
}

export class FindLeadDuplicatesQueryDto {
  @ApiProperty({
    example: '12345678901',
    description:
      'CPF ou CNPJ (com ou sem máscara). Consulta apenas documento completo.',
  })
  @IsString()
  @MaxLength(20)
  document!: string;

  @ApiPropertyOptional({
    description: 'Excluir lead da busca (edição).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  excludeId?: string;
}

export class CreateLeadDto {
  @ApiProperty({ example: 'Marina Costa' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: 'marina@email.com' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: 'Transportes Sul' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @ApiPropertyOptional({ example: 'whatsapp' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;

  @ApiPropertyOptional({ example: 'new', enum: LEAD_STATUSES, default: 'new' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: LeadStatus;

  @ApiPropertyOptional({ example: 'Interessado em seguro residencial.' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    example: 'Ana Costa',
    description:
      'Rótulo legível do responsável (nome, e-mail ou id do usuário). Resolvido para ownerUserId no serviço.',
  })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignedTo?: string;

  @ApiPropertyOptional({ enum: LEAD_DOCUMENT_TYPES })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsIn(LEAD_DOCUMENT_TYPES)
  documentType?: (typeof LEAD_DOCUMENT_TYPES)[number];

  @ApiPropertyOptional({
    example: '12345678901',
    description: 'Somente dígitos após normalização.',
  })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  document?: string;

  @ApiPropertyOptional({ description: 'Unidade de origem do lead.' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional({
    description: 'Unidades vinculadas ao lead (cadastro único multiempresa).',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  businessUnitIds?: string[];

  @ApiPropertyOptional({ enum: INTEREST_CATEGORIES, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(INTEREST_CATEGORIES, { each: true })
  interestCategories?: (typeof INTEREST_CATEGORIES)[number][];

  @ApiPropertyOptional({ example: 'Sem orçamento' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(240)
  lostReason?: string;

  @ApiPropertyOptional({ description: 'Motivo de perda configurável.' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  lossReasonId?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Agenda follow-up automático em N dias (criação).',
    minimum: 1,
    maximum: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  followUpDays?: number;

  @ApiPropertyOptional({
    enum: ['CALL', 'WHATSAPP', 'EMAIL', 'MEETING'],
    example: 'WHATSAPP',
  })
  @IsOptional()
  @IsIn(['CALL', 'WHATSAPP', 'EMAIL', 'MEETING'])
  followUpType?: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING';

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  reactivationEnabled?: boolean;

  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  reactivationDays?: number;

  @ApiPropertyOptional({ enum: LEAD_OPPORTUNITY_TYPES })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsIn(LEAD_OPPORTUNITY_TYPES)
  opportunityType?: LeadOpportunityType;

  @ApiPropertyOptional({ example: 'Porto Seguro' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  currentInsurer?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  currentPolicyNumber?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsDateString()
  policyExpiresAt?: string;
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

  @ApiPropertyOptional({
    description: 'Unidade do negócio gerado na conversão.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;
}
