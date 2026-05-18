import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const CUSTOMER_TYPES = ['PF', 'PJ'] as const;
export const CUSTOMER_STATUSES = ['active', 'inactive', 'archived'] as const;

export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

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
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
