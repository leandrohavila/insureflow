import { addUtcDays, startOfUtcDay } from './lead-reactivation.util';

export const RENEWAL_TASK_DAYS = 60;
export const RENEWAL_REMINDER_DAYS = 30;
export const RENEWAL_OPPORTUNITY_DAYS = 15;
export const FORGOTTEN_LEAD_IDLE_DAYS = 7;
export const POST_REACTIVATION_FOLLOW_UP_DAYS = 3;

export type LossReasonReactivationSnapshot = {
  reactivationEnabled: boolean;
  reactivationDays: number;
  maxAttempts: number;
};

export function utcDaysUntil(from: Date, until: Date): number {
  const start = startOfUtcDay(from).getTime();
  const end = startOfUtcDay(until).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function scheduleFollowUpAt(now: Date, days: number): Date {
  return addUtcDays(now, Math.max(1, days));
}

export function subtractUtcDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() - Math.max(1, days));
  return next;
}

export function shouldCreateRenewalTask(params: {
  daysUntil: number;
  taskCreatedAt: Date | null;
}): boolean {
  return (
    params.daysUntil >= 0 &&
    params.daysUntil <= RENEWAL_TASK_DAYS &&
    params.taskCreatedAt == null
  );
}

export function shouldSendRenewalReminder(params: {
  daysUntil: number;
  reminderSentAt: Date | null;
}): boolean {
  return (
    params.daysUntil >= 0 &&
    params.daysUntil <= RENEWAL_REMINDER_DAYS &&
    params.reminderSentAt == null
  );
}

export function shouldCreateRenewalOpportunity(params: {
  daysUntil: number;
  opportunityCreatedAt: Date | null;
}): boolean {
  return (
    params.daysUntil >= 0 &&
    params.daysUntil <= RENEWAL_OPPORTUNITY_DAYS &&
    params.opportunityCreatedAt == null
  );
}

export function isFollowUpOverdue(params: {
  status: string;
  scheduledAt: Date;
  now: Date;
}): boolean {
  if (params.status !== 'PENDING') return false;
  return startOfUtcDay(params.scheduledAt).getTime() < startOfUtcDay(params.now).getTime();
}

export function isFollowUpDueToday(params: {
  status: string;
  scheduledAt: Date;
  now: Date;
}): boolean {
  if (params.status !== 'PENDING') return false;
  return (
    startOfUtcDay(params.scheduledAt).getTime() ===
    startOfUtcDay(params.now).getTime()
  );
}

export function applyLossReasonToReactivation(params: {
  tenantEnabled: boolean;
  tenantIdleDays: number;
  tenantMaxAttempts: number;
  reason: LossReasonReactivationSnapshot | null;
}): {
  enabled: boolean;
  idleDays: number;
  maxAttempts: number;
} {
  if (!params.reason) {
    return {
      enabled: params.tenantEnabled,
      idleDays: params.tenantIdleDays,
      maxAttempts: params.tenantMaxAttempts,
    };
  }

  return {
    enabled: params.tenantEnabled && params.reason.reactivationEnabled,
    idleDays: params.reason.reactivationDays,
    maxAttempts: params.reason.maxAttempts,
  };
}

export function formatRenewalDueDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
