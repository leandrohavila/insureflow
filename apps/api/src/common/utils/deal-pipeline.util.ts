export const INSURANCE_PIPELINE_STAGES = [
  {
    slug: 'novo',
    label: 'Novo Lead',
    sortOrder: 0,
    maxDays: 2,
    alertTarget: 'OWNER' as const,
    color: 'sky',
  },
  {
    slug: 'contato',
    label: 'Contato',
    sortOrder: 1,
    maxDays: 2,
    alertTarget: 'OWNER' as const,
    color: 'violet',
  },
  {
    slug: 'cotacao',
    label: 'Cotação',
    sortOrder: 2,
    maxDays: 3,
    alertTarget: 'OWNER' as const,
    color: 'primary',
  },
  {
    slug: 'proposta',
    label: 'Proposta',
    sortOrder: 3,
    maxDays: 7,
    alertTarget: 'MANAGER' as const,
    color: 'amber',
  },
  {
    slug: 'fechamento',
    label: 'Fechamento',
    sortOrder: 4,
    maxDays: null,
    alertTarget: null,
    color: 'emerald',
  },
] as const;

export const REAL_ESTATE_PIPELINE_STAGES = [
  {
    slug: 'novo',
    label: 'Novo Lead',
    sortOrder: 0,
    maxDays: 2,
    alertTarget: 'OWNER' as const,
    color: 'sky',
  },
  {
    slug: 'primeiro-contato',
    label: 'Primeiro Contato',
    sortOrder: 1,
    maxDays: 2,
    alertTarget: 'OWNER' as const,
    color: 'violet',
  },
  {
    slug: 'visita-agendada',
    label: 'Visita Agendada',
    sortOrder: 2,
    maxDays: 5,
    alertTarget: 'OWNER' as const,
    color: 'primary',
  },
  {
    slug: 'proposta',
    label: 'Proposta',
    sortOrder: 3,
    maxDays: 7,
    alertTarget: 'MANAGER' as const,
    color: 'amber',
  },
  {
    slug: 'negociacao',
    label: 'Negociação',
    sortOrder: 4,
    maxDays: 7,
    alertTarget: 'MANAGER' as const,
    color: 'amber',
  },
  {
    slug: 'fechado',
    label: 'Fechado',
    sortOrder: 5,
    maxDays: null,
    alertTarget: null,
    color: 'emerald',
  },
  {
    slug: 'perdido',
    label: 'Perdido',
    sortOrder: 6,
    maxDays: null,
    alertTarget: null,
    color: 'slate',
  },
] as const;

export const CRM_PIPELINE_STAGES = [
  'novo',
  'qualificacao',
  'contato',
  'primeiro-contato',
  'cotacao',
  'visita',
  'visita-agendada',
  'proposta',
  'negociacao',
  'contrato',
  'fechamento',
  'fechado',
  'perdido',
] as const;
export type CrmPipelineStage = (typeof CRM_PIPELINE_STAGES)[number];

export const CRM_PIPELINE_STAGE_LABELS: Record<string, string> = {
  novo: 'Novo Lead',
  qualificacao: 'Qualificação',
  contato: 'Contato',
  cotacao: 'Cotação',
  visita: 'Visita',
  'primeiro-contato': 'Primeiro Contato',
  'visita-agendada': 'Visita Agendada',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  contrato: 'Contrato',
  fechamento: 'Fechamento',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

export function defaultStagesForUnitType(type: 'INSURANCE' | 'REAL_ESTATE') {
  return type === 'REAL_ESTATE'
    ? REAL_ESTATE_PIPELINE_STAGES
    : INSURANCE_PIPELINE_STAGES;
}

const REAL_ESTATE_STAGE_ALIASES: Record<string, string> = {
  novo: 'novo',
  qualificacao: 'primeiro-contato',
  contato: 'primeiro-contato',
  'primeiro-contato': 'primeiro-contato',
  visita: 'visita-agendada',
  'visita-agendada': 'visita-agendada',
  cotacao: 'negociacao',
  proposta: 'proposta',
  negociacao: 'negociacao',
  contrato: 'negociacao',
  fechamento: 'fechado',
  fechado: 'fechado',
  perdido: 'perdido',
};

export function canonicalDealStage(
  stage: string,
  unitType?: 'INSURANCE' | 'REAL_ESTATE' | null,
): string {
  if (unitType === 'REAL_ESTATE') {
    return REAL_ESTATE_STAGE_ALIASES[stage] ?? stage;
  }
  if (stage === 'fechado') return 'fechamento';
  if (stage === 'qualificacao') return 'contato';
  if (stage === 'negociacao') return 'proposta';
  return stage;
}

export function boardDealStage(
  stage: string,
  unitType: 'INSURANCE' | 'REAL_ESTATE' | null | undefined,
  boardType: 'INSURANCE' | 'REAL_ESTATE',
): string {
  const canonical = canonicalDealStage(stage, unitType);
  if (boardType === 'INSURANCE') {
    if (
      canonical === 'visita' ||
      canonical === 'visita-agendada' ||
      canonical === 'primeiro-contato'
    ) {
      return 'contato';
    }
    if (canonical === 'contrato' || canonical === 'negociacao') {
      return 'proposta';
    }
    if (canonical === 'fechado') return 'fechamento';
    return canonical;
  }
  if (canonical === 'contato' || canonical === 'qualificacao') {
    return 'primeiro-contato';
  }
  if (canonical === 'visita') return 'visita-agendada';
  if (canonical === 'cotacao' || canonical === 'contrato') return 'negociacao';
  if (canonical === 'fechamento') return 'fechado';
  return canonical;
}

export type SlaStatus = 'ok' | 'warning' | 'overdue';

export function computeStageSla(params: {
  enteredAt: Date | string;
  maxDays?: number | null;
  now?: Date;
}): {
  status: SlaStatus;
  dueAt: string | null;
  elapsedHours: number;
  alertTarget: string | null;
} {
  const entered =
    params.enteredAt instanceof Date
      ? params.enteredAt
      : new Date(params.enteredAt);
  const now = params.now ?? new Date();
  const elapsedHours = Math.max(
    0,
    Math.round(((now.getTime() - entered.getTime()) / 36e5) * 10) / 10,
  );
  if (!params.maxDays || !Number.isFinite(entered.getTime())) {
    return { status: 'ok', dueAt: null, elapsedHours, alertTarget: null };
  }
  const dueAt = new Date(entered.getTime() + params.maxDays * 86_400_000);
  const remainingMs = dueAt.getTime() - now.getTime();
  const percentUsed =
    params.maxDays > 0 ? elapsedHours / (params.maxDays * 24) : 0;
  const status: SlaStatus =
    remainingMs < 0
      ? 'overdue'
      : percentUsed >= 0.8 || remainingMs < 86_400_000
        ? 'warning'
        : 'ok';
  return {
    status,
    dueAt: dueAt.toISOString(),
    elapsedHours,
    alertTarget: null,
  };
}
