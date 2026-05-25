import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { LIST_QUERY_MAX_LIMIT } from '../../../common/dto/pagination.constants';

export const CUSTOMER_TYPES = ['PF', 'PJ'] as const;
export const CUSTOMER_STATUSES = ['active', 'inactive', 'archived'] as const;
export const CUSTOMER_LIFECYCLE_STAGES = [
  'won',
  'onboarding',
  'awaiting_policy',
  'policy_issued',
  'active_customer',
  'inactive_customer',
  'lost_customer',
] as const;
export const CUSTOMER_RENEWAL_STATUSES = [
  'pending',
  'in_progress',
  'renewed',
  'lapsed',
  'cancelled',
] as const;

export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type CustomerLifecycleStage = (typeof CUSTOMER_LIFECYCLE_STAGES)[number];
export type CustomerRenewalStatus = (typeof CUSTOMER_RENEWAL_STATUSES)[number];

export class ListCustomersQueryDto {
  @ApiPropertyOptional({
    example: 'maria',
    description: 'Busca por nome, documento, email ou telefone.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: CUSTOMER_TYPES })
  @IsOptional()
  @IsIn(CUSTOMER_TYPES)
  type?: CustomerType;

  @ApiPropertyOptional({ enum: CUSTOMER_STATUSES })
  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: CustomerStatus;

  @ApiPropertyOptional({ enum: CUSTOMER_LIFECYCLE_STAGES })
  @IsOptional()
  @IsIn(CUSTOMER_LIFECYCLE_STAGES)
  lifecycleStage?: CustomerLifecycleStage;

  @ApiPropertyOptional({ enum: CUSTOMER_RENEWAL_STATUSES })
  @IsOptional()
  @IsIn(CUSTOMER_RENEWAL_STATUSES)
  renewalStatus?: CustomerRenewalStatus;

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
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'PF', enum: CUSTOMER_TYPES })
  @IsIn(CUSTOMER_TYPES)
  type!: CustomerType;

  @ApiProperty({ example: 'Maria Oliveira' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: '123.456.789-00' })
  @IsString()
  @MaxLength(32)
  document!: string;

  @ApiPropertyOptional({ example: 'maria@empresa.com.br' })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({
    example: 'active',
    enum: CUSTOMER_STATUSES,
    default: 'active',
  })
  @IsIn(CUSTOMER_STATUSES)
  status!: CustomerStatus;

  @ApiPropertyOptional({ enum: CUSTOMER_LIFECYCLE_STAGES })
  @IsOptional()
  @IsIn(CUSTOMER_LIFECYCLE_STAGES)
  lifecycleStage?: CustomerLifecycleStage;

  @ApiPropertyOptional({ example: 'Acme Ltda' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @ApiPropertyOptional({ enum: CUSTOMER_RENEWAL_STATUSES })
  @IsOptional()
  @IsIn(CUSTOMER_RENEWAL_STATUSES)
  renewalStatus?: CustomerRenewalStatus;

  @ApiPropertyOptional({ example: 'default' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  renewalPipeline?: string;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
