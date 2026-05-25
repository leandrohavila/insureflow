import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const CRM_DEAL_STAGES = [
  'novo',
  'qualificacao',
  'proposta',
  'negociacao',
  'fechado',
] as const;

export const CRM_DEAL_STATUSES = ['open', 'won', 'lost', 'archived'] as const;

export type CrmDealStage = (typeof CRM_DEAL_STAGES)[number];
export type CrmDealStatus = (typeof CRM_DEAL_STATUSES)[number];

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
    description: 'Ordem manual no Kanban (fractional indexing).',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pipelineOrder?: number;
}

export class UpdateDealDto extends PartialType(CreateDealDto) {
  @ApiPropertyOptional({
    example: 1500,
    description: 'Ordem manual no Kanban (fractional indexing).',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pipelineOrder?: number;
}
