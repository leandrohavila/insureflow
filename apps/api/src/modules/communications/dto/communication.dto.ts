import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  COMMUNICATION_PROVIDER_KINDS,
  COMMUNICATION_PURPOSES,
  COMMUNICATION_STATUSES,
  MESSAGE_CHANNELS,
} from '../../../common/constants/interest-categories';
import { LIST_QUERY_MAX_LIMIT } from '../../../common/dto/pagination.constants';
import { optionalEmptyValue } from '../../../common/dto/optional-value.util';

export class ListCommunicationsQueryDto {
  @ApiPropertyOptional({ enum: COMMUNICATION_PURPOSES })
  @IsOptional()
  @IsIn(COMMUNICATION_PURPOSES)
  purpose?: (typeof COMMUNICATION_PURPOSES)[number];

  @ApiPropertyOptional({ enum: COMMUNICATION_STATUSES })
  @IsOptional()
  @IsIn(COMMUNICATION_STATUSES)
  status?: (typeof COMMUNICATION_STATUSES)[number];

  @ApiPropertyOptional({ enum: MESSAGE_CHANNELS })
  @IsOptional()
  @IsIn(MESSAGE_CHANNELS)
  channel?: (typeof MESSAGE_CHANNELS)[number];

  @ApiPropertyOptional({ enum: COMMUNICATION_PROVIDER_KINDS })
  @IsOptional()
  @IsIn(COMMUNICATION_PROVIDER_KINDS)
  provider?: (typeof COMMUNICATION_PROVIDER_KINDS)[number];

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  leadId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerId?: string;

  @ApiPropertyOptional({ description: 'Corretor (performedById)' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  userId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

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

export class CommunicationsDashboardQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  userId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional({ enum: COMMUNICATION_PURPOSES })
  @IsOptional()
  @IsIn(COMMUNICATION_PURPOSES)
  purpose?: (typeof COMMUNICATION_PURPOSES)[number];
}

export class SendCommunicationDto {
  @ApiProperty({ enum: MESSAGE_CHANNELS, example: 'WHATSAPP' })
  @IsIn(MESSAGE_CHANNELS)
  channel!: (typeof MESSAGE_CHANNELS)[number];

  @ApiProperty({ enum: COMMUNICATION_PURPOSES, example: 'MANUAL' })
  @IsIn(COMMUNICATION_PURPOSES)
  purpose!: (typeof COMMUNICATION_PURPOSES)[number];

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  leadId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  templateId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;
}

export class RecordCommunicationReplyDto {
  @ApiProperty({ example: 'Ainda tenho interesse, pode me ligar.' })
  @IsString()
  @MaxLength(4000)
  content!: string;

  @ApiPropertyOptional({ description: 'ID externo do fornecedor (webhook).' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  externalId?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  from?: string;
}

export class UpdateCommunicationProviderDto {
  @ApiPropertyOptional({ enum: COMMUNICATION_PROVIDER_KINDS })
  @IsOptional()
  @IsIn(COMMUNICATION_PROVIDER_KINDS)
  kind?: (typeof COMMUNICATION_PROVIDER_KINDS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 'insureflow-prod' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  instanceName?: string;

  @ApiPropertyOptional({ example: 'https://evolution.exemplo.com' })
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  apiUrl?: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  apiKey?: string;
}
