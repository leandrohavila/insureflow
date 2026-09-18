import {
  CRM_DEAL_STATUSES,
} from '../../modules/crm/dto/deal.dto';
export const CRM_STAGE_LABELS: Record<string, string> = {
  novo: 'Novo Lead',
  qualificacao: 'Qualificação',
  contato: 'Contato',
  cotacao: 'Cotação',
  visita: 'Visita',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  contrato: 'Contrato',
  fechamento: 'Fechamento',
  fechado: 'Fechamento',
};

export const CRM_STATUS_LABELS: Record<
  (typeof CRM_DEAL_STATUSES)[number],
  string
> = {
  open: 'Aberto',
  won: 'Ganho',
  lost: 'Perdido',
  archived: 'Arquivado',
};

export function crmStageLabel(stage: string): string {
  return CRM_STAGE_LABELS[stage as keyof typeof CRM_STAGE_LABELS] ?? stage;
}

export function crmStatusLabel(status: string): string {
  return CRM_STATUS_LABELS[status as keyof typeof CRM_STATUS_LABELS] ?? status;
}
