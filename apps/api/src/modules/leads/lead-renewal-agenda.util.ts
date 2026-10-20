import {
  LEAD_AGENDA_SUGGESTED_TIME,
  LEAD_AGENDA_TIME_ZONE,
  addCivilDays,
  civilDateFromInstant,
  civilDateTimeToUtc,
  startOfCivilDay,
} from './lead-civil-date.util';

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

/**
 * Precedência das datas de renovação:
 * - Sem datas enviadas pelo formulário, D-60/D-30/D-15 são sugestões às 09:00.
 * - Com envio explícito, só entram os horários preenchidos. Vazio remove o lembrete
 *   e não volta a calculá-lo. Uma data diferente da sugestão é personalizada e
 *   não é substituída quando o vencimento muda.
 */
export function buildLeadRenewalAgendaDrafts(input: {
  expiresAt: Date;
  now?: Date;
  explicit?: boolean;
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
    if (input.explicit && !override) return [];
    if (hasOverrides && !override) return [];
    const occurredAt = override
      ? new Date(override)
      : civilDateTimeToUtc(
          addCivilDays(civilDateFromInstant(expires), -days),
          LEAD_AGENDA_SUGGESTED_TIME,
          LEAD_AGENDA_TIME_ZONE,
        );
    if (Number.isNaN(occurredAt.getTime())) return [];
    if (!override && occurredAt < startOfCivilDay(now, LEAD_AGENDA_TIME_ZONE)) {
      return [];
    }
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

export type RenewalReminderSlot = Date | null;

/**
 * Chave ausente fica de fora do mapa e não altera a atividade.
 * `null` ou string vazia desativam o lembrete e cancelam a pendência, sem apagá-la.
 */
export function renewalReminderSlotsFromDto(dto: {
  renewalReminderD60?: string | null;
  renewalReminderD30?: string | null;
  renewalReminderD15?: string | null;
}): {
  anyPresent: boolean;
  slots: Partial<
    Record<(typeof LEAD_RENEWAL_OFFSETS_DAYS)[number], RenewalReminderSlot>
  >;
} {
  const keys = [
    ['renewalReminderD60', 60],
    ['renewalReminderD30', 30],
    ['renewalReminderD15', 15],
  ] as const;
  const slots: Partial<
    Record<(typeof LEAD_RENEWAL_OFFSETS_DAYS)[number], RenewalReminderSlot>
  > = {};
  let anyPresent = false;
  for (const [key, days] of keys) {
    if (dto[key] === undefined) continue;
    anyPresent = true;
    const value = dto[key];
    if (value == null || !value.trim()) {
      slots[days] = null;
      continue;
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) slots[days] = parsed;
  }
  return { anyPresent, slots };
}
