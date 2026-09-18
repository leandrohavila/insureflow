export const SLA_WARNING_RATIO = 0.8;

export const SLA_ESCALATION_LEVELS = ['OWNER', 'MANAGER', 'DIRECTOR'] as const;
export type SlaEscalationLevel = (typeof SLA_ESCALATION_LEVELS)[number];

export const SLA_ESCALATION = [
  { level: 'OWNER' as const, afterDays: 3 },
  { level: 'MANAGER' as const, afterDays: 5 },
  { level: 'DIRECTOR' as const, afterDays: 7 },
];

export const RENEWAL_IDLE_ALERT_DAYS = 7;
export const CROSS_SELL_IDLE_ALERT_DAYS = 7;
export const OPPORTUNITY_IDLE_ALERT_DAYS = 7;

export const PENDING_RENEWAL_STATUSES = [
  'ACTIVE',
  'RENEWAL_PENDING',
  'RENEWAL_IN_PROGRESS',
] as const;

export function elapsedDaysFromHours(elapsedHours: number) {
  return Math.floor(Math.max(0, elapsedHours) / 24);
}

export function escalationLevelsDue(elapsedDays: number): SlaEscalationLevel[] {
  return SLA_ESCALATION.filter((item) => elapsedDays >= item.afterDays).map(
    (item) => item.level,
  );
}

export function isIdleSince(params: {
  lastMovementAt: Date | string | null | undefined;
  idleDays: number;
  now?: Date;
}) {
  if (!params.lastMovementAt) return true;
  const last =
    params.lastMovementAt instanceof Date
      ? params.lastMovementAt
      : new Date(params.lastMovementAt);
  if (!Number.isFinite(last.getTime())) return true;
  const now = params.now ?? new Date();
  return now.getTime() - last.getTime() >= params.idleDays * 86_400_000;
}

export function shouldAlertIdleRenewal(params: {
  status: string;
  renewalDate: Date | string;
  updatedAt: Date | string;
  now?: Date;
}) {
  if (
    !(PENDING_RENEWAL_STATUSES as readonly string[]).includes(params.status)
  ) {
    return false;
  }
  const now = params.now ?? new Date();
  const renewalDate =
    params.renewalDate instanceof Date
      ? params.renewalDate
      : new Date(params.renewalDate);
  const overdue = Number.isFinite(renewalDate.getTime())
    ? renewalDate.getTime() <= now.getTime()
    : false;
  return (
    overdue ||
    isIdleSince({
      lastMovementAt: params.updatedAt,
      idleDays: RENEWAL_IDLE_ALERT_DAYS,
      now,
    })
  );
}

export type CustomerPendencyKind =
  | 'sla_overdue'
  | 'renewal_pending'
  | 'follow_up_pending'
  | 'cross_sell_pending';

export type CustomerPendency = {
  id: string;
  kind: CustomerPendencyKind;
  title: string;
  detail: string;
};

export function slaPendencyTitle(status: 'warning' | 'overdue') {
  return status === 'overdue' ? 'SLA atrasado' : 'SLA em alerta';
}
