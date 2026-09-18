import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { optionalEmptyValue } from '../../../common/dto/optional-value.util';
import { MESSAGE_CHANNELS, MESSAGE_TEMPLATE_KINDS } from '../../../common/constants/interest-categories';

export class ListMessageTemplatesQueryDto {
  @ApiPropertyOptional({ enum: MESSAGE_CHANNELS })
  @IsOptional()
  @IsIn(MESSAGE_CHANNELS)
  channel?: (typeof MESSAGE_CHANNELS)[number];

  @ApiPropertyOptional({ enum: MESSAGE_TEMPLATE_KINDS })
  @IsOptional()
  @IsIn(MESSAGE_TEMPLATE_KINDS)
  kind?: (typeof MESSAGE_TEMPLATE_KINDS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  active?: boolean;
}

export class CreateMessageTemplateDto {
  @ApiProperty({ example: 'Reativação — retorno de contato' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ enum: MESSAGE_CHANNELS, example: 'WHATSAPP' })
  @IsIn(MESSAGE_CHANNELS)
  channel!: (typeof MESSAGE_CHANNELS)[number];

  @ApiProperty({
    example:
      'Olá {{nome}}. Há algum tempo conversamos sobre {{interesse}}. Gostaria de verificar se ainda possui interesse. Posso ajudar?',
  })
  @IsString()
  @MaxLength(4000)
  content!: string;

  @ApiPropertyOptional()
  @Transform(optionalEmptyValue)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessUnitId?: string;

  @ApiPropertyOptional({ enum: MESSAGE_TEMPLATE_KINDS })
  @IsOptional()
  @IsIn(MESSAGE_TEMPLATE_KINDS)
  kind?: (typeof MESSAGE_TEMPLATE_KINDS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;
}

export class UpdateMessageTemplateDto extends PartialType(
  CreateMessageTemplateDto,
) {}
