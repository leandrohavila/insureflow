import { inAgendaWindow } from './commercial-agenda-window.util';

export const AGENDA_PRIORITIES = ['high', 'medium', 'low'] as const;
export type AgendaPriority = (typeof AGENDA_PRIORITIES)[number];

export const AGENDA_PRIORITY_LABELS: Record<AgendaPriority, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Normal',
};

export function agendaPriority(at: Date, now: Date): AgendaPriority {
  if (inAgendaWindow(at, 'overdue', now)) return 'high';
  if (inAgendaWindow(at, 'today', now)) return 'medium';
  return 'low';
}
