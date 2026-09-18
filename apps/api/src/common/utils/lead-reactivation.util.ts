export type LeadReactivationSettingsSnapshot = {
  enabled: boolean;
  idleDays: number;
  maxAttempts: number;
};

export function addUtcDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + Math.max(1, days));
  return next;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function isLeadEligibleForReactivation(params: {
  status: string;
  reactivationEnabled: boolean;
  nextReactivationAt: Date | null;
  reactivationAttempts: number;
  maxAttempts: number;
  now: Date;
}): boolean {
  if (params.status !== 'lost') return false;
  if (!params.reactivationEnabled) return false;
  if (!params.nextReactivationAt) return false;
  if (params.reactivationAttempts >= params.maxAttempts) return false;
  return params.nextReactivationAt.getTime() <= params.now.getTime();
}

export function buildLostReactivationPatch(params: {
  previousStatus: string;
  nextStatus?: string;
  lostReason?: string | null;
  now: Date;
  settings: LeadReactivationSettingsSnapshot | null;
  reasonOverride?: {
    enabled: boolean;
    idleDays: number;
  } | null;
}): Record<string, unknown> {
  const nextStatus = params.nextStatus ?? params.previousStatus;
  if (nextStatus !== 'lost' || params.previousStatus === 'lost') {
    const patch: Record<string, unknown> = {};
    if (params.lostReason !== undefined && nextStatus === 'lost') {
      patch.lostReason = params.lostReason;
    }
    return patch;
  }

  // Precedência: LeadLossReason.reactivationDays (reasonOverride) > settings.idleDays.
  // Sem reasonOverride, settings do tenant só como fallback legado.
  const idleDays =
    params.reasonOverride?.idleDays ?? params.settings?.idleDays ?? null;
  const enabled =
    params.reasonOverride != null
      ? params.reasonOverride.enabled
      : (params.settings?.enabled ?? false);

  if (enabled && (idleDays == null || idleDays < 1)) {
    return {
      lostAt: params.now,
      ...(params.lostReason !== undefined
        ? { lostReason: params.lostReason }
        : {}),
      reactivationAttempts: 0,
      lastReactivatedAt: null,
      nextReactivationAt: null,
      reactivationDays: null,
      reactivationEnabled: false,
    };
  }

  return {
    lostAt: params.now,
    ...(params.lostReason !== undefined
      ? { lostReason: params.lostReason }
      : {}),
    reactivationAttempts: 0,
    lastReactivatedAt: null,
    nextReactivationAt:
      enabled && idleDays != null ? addUtcDays(params.now, idleDays) : null,
    reactivationDays: enabled && idleDays != null ? idleDays : null,
    reactivationEnabled: enabled,
  };
}

export function buildNextAttemptPatch(params: {
  now: Date;
  currentAttempts: number;
  idleDays: number;
}): {
  reactivationAttempts: number;
  lastReactivatedAt: Date;
  nextReactivationAt: Date;
  lastInteractionAt: Date;
  lastContactAt: Date;
} {
  return {
    reactivationAttempts: params.currentAttempts + 1,
    lastReactivatedAt: params.now,
    nextReactivationAt: addUtcDays(params.now, params.idleDays),
    lastInteractionAt: params.now,
    lastContactAt: params.now,
  };
}

/** Manual reopen: lost → active funnel status; leave lostAt/lossReason for analytics. */
export function buildManualReactivatePatch(params: {
  now: Date;
  toStatus?: string;
}): {
  status: string;
  nextReactivationAt: null;
  lastReactivatedAt: Date;
  lastInteractionAt: Date;
  lastContactAt: Date;
} {
  return {
    status: params.toStatus ?? 'contacted',
    nextReactivationAt: null,
    lastReactivatedAt: params.now,
    lastInteractionAt: params.now,
    lastContactAt: params.now,
  };
}

/** Postpone from now + N days, or an explicit custom date (must be in the future). */
export function buildPostponeReactivationAt(params: {
  now: Date;
  days?: number;
  at?: Date;
}): Date {
  if (params.at) {
    const next = new Date(params.at.getTime());
    if (Number.isNaN(next.getTime())) {
      throw new Error('INVALID_POSTPONE_AT');
    }
    if (next.getTime() <= params.now.getTime()) {
      throw new Error('POSTPONE_AT_MUST_BE_FUTURE');
    }
    return next;
  }
  const days = params.days ?? 7;
  if (!Number.isFinite(days) || days < 1) {
    throw new Error('INVALID_POSTPONE_DAYS');
  }
  return addUtcDays(params.now, Math.floor(days));
}

export function daysOverdue(nextReactivationAt: Date, now: Date): number {
  const startNext = startOfUtcDay(nextReactivationAt);
  const startNow = startOfUtcDay(now);
  const diffMs = startNow.getTime() - startNext.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}
