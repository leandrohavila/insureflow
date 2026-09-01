export const LEAD_RENEWAL_OFFSETS_DAYS = [60, 30, 15] as const;

export const LEAD_RENEWAL_EVENT_PREFIX = 'lead_renewal_d';

export type LeadRenewalAgendaDraft = {
  type: 'renewal';
  status: 'pending';
  subject: string;
  description: string;
  occurredAt: Date;
  nextFollowUpAt: Date;
  operationalEventKind: string;
};

export function leadRenewalEventKind(days: number) {
  return `${LEAD_RENEWAL_EVENT_PREFIX}${days}`;
}

export function buildLeadRenewalAgendaDrafts(input: {
  expiresAt: Date;
  now?: Date;
  scheduledAtByDays?: Partial<
    Record<(typeof LEAD_RENEWAL_OFFSETS_DAYS)[number], Date>
  >;
}): LeadRenewalAgendaDraft[] {
  const now = input.now ?? new Date();
  const expires = new Date(input.expiresAt);
  if (Number.isNaN(expires.getTime())) return [];
  const hasOverrides =
    input.scheduledAtByDays &&
    Object.values(input.scheduledAtByDays).some(
      (value) => value instanceof Date && !Number.isNaN(value.getTime()),
    );

  return LEAD_RENEWAL_OFFSETS_DAYS.flatMap((days) => {
    const override = input.scheduledAtByDays?.[days];
    if (hasOverrides && !override) return [];
    const occurredAt = override ? new Date(override) : new Date(expires);
    if (!override) {
      occurredAt.setDate(occurredAt.getDate() - days);
      occurredAt.setHours(9, 0, 0, 0);
    }
    if (Number.isNaN(occurredAt.getTime())) return [];
    if (!override && occurredAt < startOfLocalDay(now)) return [];
    return [
      {
        type: 'renewal' as const,
        status: 'pending' as const,
        subject: `Renovação D-${days}`,
        description: `Contato automático ${days} dias antes do vencimento da apólice.`,
        occurredAt,
        nextFollowUpAt: occurredAt,
        operationalEventKind: leadRenewalEventKind(days),
      },
    ];
  });
}

function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function renewalReminderDatesFromDto(dto: {
  renewalReminderD60?: string;
  renewalReminderD30?: string;
  renewalReminderD15?: string;
}):
  | Partial<Record<(typeof LEAD_RENEWAL_OFFSETS_DAYS)[number], Date>>
  | undefined {
  const scheduledAtByDays: Partial<
    Record<(typeof LEAD_RENEWAL_OFFSETS_DAYS)[number], Date>
  > = {};
  if (dto.renewalReminderD60) {
    const parsed = new Date(dto.renewalReminderD60);
    if (!Number.isNaN(parsed.getTime())) scheduledAtByDays[60] = parsed;
  }
  if (dto.renewalReminderD30) {
    const parsed = new Date(dto.renewalReminderD30);
    if (!Number.isNaN(parsed.getTime())) scheduledAtByDays[30] = parsed;
  }
  if (dto.renewalReminderD15) {
    const parsed = new Date(dto.renewalReminderD15);
    if (!Number.isNaN(parsed.getTime())) scheduledAtByDays[15] = parsed;
  }
  return Object.keys(scheduledAtByDays).length ? scheduledAtByDays : undefined;
}
