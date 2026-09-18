import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export const LEAD_SHARE_PERMISSIONS = ['read', 'comment'] as const;
export type LeadSharePermissionDto = (typeof LEAD_SHARE_PERMISSIONS)[number];

export class CreateLeadShareDto {
  @ApiProperty({ description: 'ID do usuário que receberá o compartilhamento' })
  @IsString()
  sharedWithUserId!: string;

  @ApiPropertyOptional({ enum: LEAD_SHARE_PERMISSIONS, default: 'read' })
  @IsOptional()
  @IsIn(LEAD_SHARE_PERMISSIONS)
  permission?: LeadSharePermissionDto;

  @ApiPropertyOptional({ description: 'Expiração ISO 8601' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateLeadShareDto {
  @ApiPropertyOptional({ enum: LEAD_SHARE_PERMISSIONS })
  @IsOptional()
  @IsIn(LEAD_SHARE_PERMISSIONS)
  permission?: LeadSharePermissionDto;

  @ApiPropertyOptional({ description: 'Expiração ISO 8601; null remove' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional({ description: 'Revogar compartilhamento' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  revoked?: boolean;
}
