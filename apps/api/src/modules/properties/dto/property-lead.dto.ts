import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePublicPropertyLeadDto {
  @ApiProperty({ example: 'insureflow' })
  @IsString()
  @MaxLength(80)
  tenantSlug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  businessUnitSlug?: string;

  @ApiPropertyOptional({ description: 'ID do imóvel publicado' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Slug do imóvel publicado' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  propertySlug?: string;

  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
