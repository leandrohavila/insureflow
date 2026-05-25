import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PolicyRenewalStatus, PolicyStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { LIST_QUERY_MAX_LIMIT } from '../../../common/dto/pagination.constants';

export { PolicyStatus, PolicyRenewalStatus };

export class ListPoliciesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dealId?: string;

  @ApiPropertyOptional({ enum: PolicyStatus })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiPropertyOptional({ enum: PolicyRenewalStatus })
  @IsOptional()
  @IsEnum(PolicyRenewalStatus)
  renewalStatus?: PolicyRenewalStatus;

  @ApiPropertyOptional({ example: 'Porto Seguro' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  insurer?: string;

  @ApiPropertyOptional({ description: 'Vigência até (limite superior, ISO).' })
  @IsOptional()
  @IsDateString()
  effectiveToBefore?: string;

  @ApiPropertyOptional({ description: 'Vigência até (limite inferior, ISO).' })
  @IsOptional()
  @IsDateString()
  effectiveToAfter?: string;

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

export class CreatePolicyDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  customerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  dealId?: string;

  @ApiProperty({ example: 'Porto Seguro' })
  @IsString()
  @MaxLength(120)
  insurer!: string;

  @ApiProperty({ example: 'PS-2026-000123' })
  @IsString()
  @MaxLength(64)
  policyNumber!: string;

  @ApiProperty({ example: 'Seguro empresarial' })
  @IsString()
  @MaxLength(120)
  productLine!: string;

  @ApiPropertyOptional({ example: 'Compreensivo' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  modality?: string;

  @ApiProperty({ example: 12000, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  premiumValue!: number;

  @ApiPropertyOptional({ example: 1200, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  commissionValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ enum: PolicyStatus, default: PolicyStatus.pending })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiPropertyOptional({ enum: PolicyRenewalStatus })
  @IsOptional()
  @IsEnum(PolicyRenewalStatus)
  renewalStatus?: PolicyRenewalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  brokerUserId?: string;
}

export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {}

export class IssuePolicyFromDealDto {
  @ApiProperty({ description: 'Negócio ganho com cliente vinculado.' })
  @IsString()
  @MaxLength(40)
  dealId!: string;

  @ApiProperty({ example: 'Porto Seguro' })
  @IsString()
  @MaxLength(120)
  insurer!: string;

  @ApiProperty({ example: 'PS-2026-000123' })
  @IsString()
  @MaxLength(64)
  policyNumber!: string;

  @ApiProperty({ example: 'Seguro empresarial' })
  @IsString()
  @MaxLength(120)
  productLine!: string;

  @ApiPropertyOptional({ example: 'Compreensivo' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  modality?: string;

  @ApiProperty({ example: 12000, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  premiumValue!: number;

  @ApiPropertyOptional({ example: 1200, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  commissionValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  brokerUserId?: string;
}

export class CancelPolicyDto {
  @ApiPropertyOptional({ example: 'Solicitação do segurado' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Data do cancelamento (ISO).' })
  @IsOptional()
  @IsDateString()
  cancelledAt?: string;
}

export class RenewPolicyDto {
  @ApiProperty({ example: 'PS-2027-000456' })
  @IsString()
  @MaxLength(64)
  policyNumber!: string;

  @ApiProperty()
  @IsDateString()
  effectiveFrom!: string;

  @ApiProperty()
  @IsDateString()
  effectiveTo!: string;

  @ApiPropertyOptional({ example: 13000, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  premiumValue?: number;

  @ApiPropertyOptional({ example: 1300, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  commissionValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  insurer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  productLine?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  modality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedAt?: string;
}
