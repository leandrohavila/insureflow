import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const QUOTE_WORKFLOW_STATUSES = [
  'received',
  'in_analysis',
  'quote_created',
  'quote_sent',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;

export const QUOTE_LINE_STATUSES = [
  'draft',
  'quoted',
  'sent',
  'selected',
  'rejected',
  'expired',
] as const;

export const PROPOSAL_STATUSES = [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
] as const;

export type QuoteWorkflowStatus = (typeof QUOTE_WORKFLOW_STATUSES)[number];
export type QuoteLineStatus = (typeof QUOTE_LINE_STATUSES)[number];
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export class ListQuoteComparisonsQueryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  submissionId?: string;

  @ApiPropertyOptional({ enum: QUOTE_WORKFLOW_STATUSES })
  @IsOptional()
  @IsIn([...QUOTE_WORKFLOW_STATUSES])
  workflowStatus?: QuoteWorkflowStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class CreateQuoteComparisonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  submissionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateQuoteComparisonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: QUOTE_WORKFLOW_STATUSES })
  @IsOptional()
  @IsIn([...QUOTE_WORKFLOW_STATUSES])
  workflowStatus?: QuoteWorkflowStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class CreateQuoteLineDto {
  @ApiProperty({ example: 'Porto Seguro' })
  @IsString()
  @MaxLength(120)
  insurer!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  product?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  plan?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  premiumValue!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  franchiseValue?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coverages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assistance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @ApiPropertyOptional({ enum: QUOTE_LINE_STATUSES })
  @IsOptional()
  @IsIn([...QUOTE_LINE_STATUSES])
  status?: QuoteLineStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateQuoteLineDto extends PartialType(CreateQuoteLineDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSelected?: boolean;
}

export class CreateProposalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Validade da proposta (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateProposalDto {
  @ApiPropertyOptional({ enum: PROPOSAL_STATUSES })
  @IsOptional()
  @IsIn([...PROPOSAL_STATUSES])
  status?: ProposalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Validade da proposta (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ListProposalsQueryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comparisonId?: string;

  @ApiPropertyOptional({ enum: PROPOSAL_STATUSES })
  @IsOptional()
  @IsIn([...PROPOSAL_STATUSES])
  status?: ProposalStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class BulkCreateQuoteLinesDto {
  @ApiProperty({ type: [CreateQuoteLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteLineDto)
  lines!: CreateQuoteLineDto[];
}
