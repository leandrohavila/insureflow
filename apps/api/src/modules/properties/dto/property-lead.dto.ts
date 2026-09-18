import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
  type ValidationArguments,
} from 'class-validator';

export const PUBLIC_PROPERTY_LEAD_SOURCES = [
  'public_portal',
  'public_portal_whatsapp',
  'public_portal_home',
  'public_portal_listing',
  'public_portal_card',
] as const;

export type PublicPropertyLeadSource =
  (typeof PUBLIC_PROPERTY_LEAD_SOURCES)[number];

/** Teto do JSON de atribuição (evitar payload abusivo). */
export const PROPERTY_LEAD_METADATA_MAX_BYTES = 8192;

@ValidatorConstraint({ name: 'isPropertyLeadMetadata', async: false })
export class IsPropertyLeadMetadataConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown) {
    if (value === undefined || value === null) return true;
    if (typeof value !== 'object' || Array.isArray(value)) return false;
    try {
      return JSON.stringify(value).length <= PROPERTY_LEAD_METADATA_MAX_BYTES;
    } catch {
      return false;
    }
  }

  defaultMessage(_args: ValidationArguments) {
    return `metadata deve ser um objeto JSON de até ${PROPERTY_LEAD_METADATA_MAX_BYTES} bytes`;
  }
}

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

  @ApiPropertyOptional({
    enum: PUBLIC_PROPERTY_LEAD_SOURCES,
    description: 'Canal de captura no portal. Default: public_portal',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @IsIn(PUBLIC_PROPERTY_LEAD_SOURCES)
  source?: PublicPropertyLeadSource;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description:
      'Atribuição: utm_*, gclid, fbclid, ttclid, landingPage, referrer, device, placement',
  })
  @IsOptional()
  @IsObject()
  @Validate(IsPropertyLeadMetadataConstraint)
  metadata?: Record<string, unknown>;
}

export class ListPropertyLeadsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;
}
