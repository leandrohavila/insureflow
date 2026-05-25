import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const QUESTIONNAIRE_TEMPLATE_STATUSES = [
  'draft',
  'active',
  'archived',
] as const;

export const QUESTIONNAIRE_FIELD_TYPES = [
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DATE',
  'BOOLEAN',
  'SELECT',
  'MULTI_SELECT',
  'EMAIL',
  'PHONE',
  'CURRENCY',
  'FILE',
] as const;

export const QUESTIONNAIRE_ORIGINS = [
  'WHATSAPP',
  'INSTAGRAM',
  'SITE',
  'INTERNAL',
  'PHONE',
  'INDICATION',
] as const;

export const QUESTIONNAIRE_SUBMISSION_MODES = ['INTERNAL', 'EXTERNAL'] as const;

export const QUESTIONNAIRE_SUBMISSION_STATUSES = [
  'draft',
  'submitted',
  'reviewed',
  'archived',
] as const;

export type QuestionnaireTemplateStatus =
  (typeof QUESTIONNAIRE_TEMPLATE_STATUSES)[number];
export type QuestionnaireFieldType = (typeof QUESTIONNAIRE_FIELD_TYPES)[number];
export type QuestionnaireOrigin = (typeof QUESTIONNAIRE_ORIGINS)[number];
export type QuestionnaireSubmissionMode =
  (typeof QUESTIONNAIRE_SUBMISSION_MODES)[number];
export type QuestionnaireSubmissionStatus =
  (typeof QUESTIONNAIRE_SUBMISSION_STATUSES)[number];

export class ListQuestionnaireTemplatesQueryDto {
  @ApiPropertyOptional({ example: 'auto', description: 'Busca por nome.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: QUESTIONNAIRE_TEMPLATE_STATUSES })
  @IsOptional()
  @IsIn(QUESTIONNAIRE_TEMPLATE_STATUSES)
  status?: QuestionnaireTemplateStatus;

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

export class CreateQuestionnaireTemplateDto {
  @ApiProperty({ example: 'Seguro auto individual' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({
    example: 'Questionário inicial para cotação de seguro auto.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    enum: QUESTIONNAIRE_TEMPLATE_STATUSES,
    default: 'draft',
  })
  @IsOptional()
  @IsIn(QUESTIONNAIRE_TEMPLATE_STATUSES)
  status?: QuestionnaireTemplateStatus;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class UpdateQuestionnaireTemplateDto extends PartialType(
  CreateQuestionnaireTemplateDto,
) {}

export class QuestionnaireFieldOptionDto {
  @ApiProperty({ example: 'Sim' })
  @IsString()
  @MaxLength(160)
  label!: string;

  @ApiPropertyOptional({ example: 'yes' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  value?: string;
}

export class CreateQuestionnaireFieldDto {
  @ApiProperty({
    example: 'vehicle_model',
    description: 'Chave estável usada no JSON de respostas.',
  })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z][a-z0-9_]*$/)
  key!: string;

  @ApiProperty({ example: 'Modelo do veículo' })
  @IsString()
  @MaxLength(160)
  label!: string;

  @ApiProperty({ enum: QUESTIONNAIRE_FIELD_TYPES, example: 'TEXT' })
  @IsIn(QUESTIONNAIRE_FIELD_TYPES)
  type!: QuestionnaireFieldType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ example: 'Ex.: Corolla XEI 2022' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  placeholder?: string;

  @ApiPropertyOptional({ example: 'Informe o modelo conforme documento.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  helpText?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    description: 'Opções para SELECT/MULTI_SELECT.',
    example: [{ label: 'Sim', value: 'yes' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionnaireFieldOptionDto)
  options?: QuestionnaireFieldOptionDto[];

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  validation?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class UpdateQuestionnaireFieldDto extends PartialType(
  CreateQuestionnaireFieldDto,
) {}

export class ListQuestionnaireSubmissionsQueryDto {
  @ApiPropertyOptional({ example: 'template_cuid' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ enum: QUESTIONNAIRE_SUBMISSION_STATUSES })
  @IsOptional()
  @IsIn(QUESTIONNAIRE_SUBMISSION_STATUSES)
  status?: QuestionnaireSubmissionStatus;

  @ApiPropertyOptional({ enum: QUESTIONNAIRE_ORIGINS })
  @IsOptional()
  @IsIn(QUESTIONNAIRE_ORIGINS)
  origin?: QuestionnaireOrigin;

  @ApiPropertyOptional({ enum: QUESTIONNAIRE_SUBMISSION_MODES })
  @IsOptional()
  @IsIn(QUESTIONNAIRE_SUBMISSION_MODES)
  mode?: QuestionnaireSubmissionMode;

  @ApiPropertyOptional({ example: 'lead_cuid' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ example: 'customer_cuid' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 'deal_cuid' })
  @IsOptional()
  @IsString()
  dealId?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

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

export class CreateQuestionnaireSubmissionDto {
  @ApiProperty({ example: 'template_cuid' })
  @IsString()
  templateId!: string;

  @ApiPropertyOptional({
    enum: QUESTIONNAIRE_SUBMISSION_MODES,
    default: 'INTERNAL',
  })
  @IsOptional()
  @IsIn(QUESTIONNAIRE_SUBMISSION_MODES)
  mode?: QuestionnaireSubmissionMode;

  @ApiPropertyOptional({ enum: QUESTIONNAIRE_ORIGINS, default: 'INTERNAL' })
  @IsOptional()
  @IsIn(QUESTIONNAIRE_ORIGINS)
  origin?: QuestionnaireOrigin;

  @ApiPropertyOptional({
    enum: QUESTIONNAIRE_SUBMISSION_STATUSES,
    default: 'draft',
  })
  @IsOptional()
  @IsIn(QUESTIONNAIRE_SUBMISSION_STATUSES)
  status?: QuestionnaireSubmissionStatus;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  answers?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'lead_cuid' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ example: 'customer_cuid' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 'deal_cuid' })
  @IsOptional()
  @IsString()
  dealId?: string;

  @ApiPropertyOptional({ example: '2026-05-18T16:25:00.000Z' })
  @IsOptional()
  @IsDateString()
  submittedAt?: string;
}

export class UpdateQuestionnaireSubmissionDto extends PartialType(
  CreateQuestionnaireSubmissionDto,
) {}
