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

  const idleDays =
    params.reasonOverride?.idleDays ?? params.settings?.idleDays ?? 30;
  const enabled =
    params.reasonOverride?.enabled ?? params.settings?.enabled ?? false;

  return {
    lostAt: params.now,
    ...(params.lostReason !== undefined ? { lostReason: params.lostReason } : {}),
    reactivationAttempts: 0,
    lastReactivatedAt: null,
    nextReactivationAt: enabled ? addUtcDays(params.now, idleDays) : null,
    reactivationDays: idleDays,
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
