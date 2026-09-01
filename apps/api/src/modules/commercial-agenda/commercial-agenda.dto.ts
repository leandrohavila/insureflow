import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const COMMERCIAL_AGENDA_WINDOWS = [
  'today',
  'overdue',
  'next7',
  'next30',
  'future',
] as const;
export type CommercialAgendaWindow = (typeof COMMERCIAL_AGENDA_WINDOWS)[number];

export const COMMERCIAL_AGENDA_TYPES = [
  'FOLLOW_UP',
  'RENEWAL',
  'REACTIVATION',
  'SLA',
  'CALL',
  'WHATSAPP',
  'EMAIL',
  'MEETING',
  'VISIT',
  'TASK',
] as const;
export type CommercialAgendaType = (typeof COMMERCIAL_AGENDA_TYPES)[number];

export class ListCommercialAgendaQueryDto {
  @IsOptional()
  @IsIn(COMMERCIAL_AGENDA_WINDOWS)
  window?: CommercialAgendaWindow;

  @IsOptional()
  @IsIn(COMMERCIAL_AGENDA_TYPES)
  type?: CommercialAgendaType;

  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 100;
}
