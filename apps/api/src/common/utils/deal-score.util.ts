export const DEAL_SOURCE_TYPES = [
  'LEAD',
  'RENEWAL',
  'CROSS_SELL',
  'MANUAL',
  'REACTIVATION',
] as const;
export type DealSourceType = (typeof DEAL_SOURCE_TYPES)[number];

export const DEAL_SCORES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type DealScore = (typeof DEAL_SCORES)[number];

export const DEAL_SOURCE_LABELS: Record<DealSourceType, string> = {
  LEAD: 'Lead',
  RENEWAL: 'Renovação',
  CROSS_SELL: 'Cross-sell',
  MANUAL: 'Manual',
  REACTIVATION: 'Reativação',
};

export const DEAL_SCORE_LABELS: Record<DealScore, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

export function computeDealScore(sourceType: DealSourceType): DealScore {
  switch (sourceType) {
    case 'RENEWAL':
    case 'CROSS_SELL':
      return 'HIGH';
    case 'LEAD':
    case 'REACTIVATION':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
}

export function resolveDealSourceType(params: {
  sourceType?: string | null;
  leadReactivated?: boolean;
}): DealSourceType {
  const raw = params.sourceType?.toUpperCase();
  if (raw && (DEAL_SOURCE_TYPES as readonly string[]).includes(raw)) {
    return raw as DealSourceType;
  }
  if (params.leadReactivated) return 'REACTIVATION';
  return 'MANUAL';
}
