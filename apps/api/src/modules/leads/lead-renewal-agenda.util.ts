export const LEAD_RENEWAL_OFFSETS_DAYS = [60, 30, 15] as const;

export const LEAD_RENEWAL_EVENT_PREFIX = 'lead_renewal_d';

export type LeadRenewalAgendaDraft = {
  type: 'renewal';
  status: 'pending';
  subject: string;
  description: string;
  occurredAt: Date;
  operationalEventKind: string;
};

export function leadRenewalEventKind(days: number) {
  return `${LEAD_RENEWAL_EVENT_PREFIX}${days}`;
}

export function buildLeadRenewalAgendaDrafts(input: {
  expiresAt: Date;
  now?: Date;
}): LeadRenewalAgendaDraft[] {
  const now = input.now ?? new Date();
  const expires = new Date(input.expiresAt);
  if (Number.isNaN(expires.getTime())) return [];

  return LEAD_RENEWAL_OFFSETS_DAYS.flatMap((days) => {
    const occurredAt = new Date(expires);
    occurredAt.setDate(occurredAt.getDate() - days);
    occurredAt.setHours(9, 0, 0, 0);
    if (occurredAt < startOfLocalDay(now)) return [];
    return [
      {
        type: 'renewal' as const,
        status: 'pending' as const,
        subject: `Renovação D-${days}`,
        description: `Contato automático ${days} dias antes do vencimento da apólice.`,
        occurredAt,
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
