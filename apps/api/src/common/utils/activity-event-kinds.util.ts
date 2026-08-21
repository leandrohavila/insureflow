/** Catálogo unificado de eventos de sistema publicados via Activity Engine. */
/** Espelho frontend: apps/web/lib/crm/activity-event-kinds.ts — manter sincronizado. */

export const COMMERCIAL_EVENT_KINDS = [
  'lead_converted',
  'lead_reactivated',
  'lead_business_unit_linked',
  'lead_lost',
  'lead_follow_up_scheduled',
  'lead_follow_up_due',
  'lead_follow_up_completed',
  'communication_sent',
  'communication_delivered',
  'communication_read',
  'communication_failed',
  'communication_replied',
  'deal_stage_changed',
  'deal_status_changed',
  'deal_created',
  'deal_lost',
  'deal_reopened',
  'sla_warning',
  'sla_overdue',
  'sla_escalated',
  'renewal_overdue',
  'reactivation_retry',
  'target_created',
  'target_updated',
  'deal_commission_created',
  'commission_created',
  'commission_approved',
  'commission_paid',
  'performance_viewed',
  'opportunity_created',
  'opportunity_converted',
  'questionnaire_submitted',
  'questionnaire_reviewed',
  'quote_created',
  'quote_updated',
  'quote_sent',
  'quote_compared',
  'proposal_created',
  'proposal_pdf_generated',
  'proposal_sent',
  'proposal_viewed',
  'proposal_accepted',
  'proposal_rejected',
  'proposal_expired',
] as const;

export const POST_SALE_EVENT_KINDS = [
  'deal_won',
  'policy_issued',
  'policy_issuance',
  'policy_upload',
  'renewal',
  'renewal_started',
  'renewal_completed',
  'renewal_task_created',
  'renewal_reminder_sent',
  'renewal_opportunity_created',
  'claim',
  'follow_up',
  'billing',
  'cancellation',
  'lifecycle_change',
] as const;

export const ACTIVITY_EVENT_KINDS = [
  ...COMMERCIAL_EVENT_KINDS,
  ...POST_SALE_EVENT_KINDS,
] as const;

export type CommercialEventKind = (typeof COMMERCIAL_EVENT_KINDS)[number];
export type PostSaleEventKind = (typeof POST_SALE_EVENT_KINDS)[number];
export type ActivityEventKind = (typeof ACTIVITY_EVENT_KINDS)[number];

/** @deprecated Prefer ACTIVITY_EVENT_KINDS — mantido para compatibilidade. */
export const OPERATIONAL_EVENT_KINDS = ACTIVITY_EVENT_KINDS;
export type OperationalEventKind = ActivityEventKind;

export const ACTIVITY_EVENT_LABELS: Record<ActivityEventKind, string> = {
  lead_converted: 'Lead convertido',
  lead_reactivated: 'Lead reativado',
  lead_business_unit_linked: 'Unidade de negócio vinculada',
  lead_lost: 'Lead perdido',
  lead_follow_up_scheduled: 'Follow-up agendado',
  lead_follow_up_due: 'Follow-up pendente',
  lead_follow_up_completed: 'Follow-up concluído',
  communication_sent: 'Comunicação enviada',
  communication_delivered: 'Comunicação entregue',
  communication_read: 'Comunicação lida',
  communication_failed: 'Falha no envio',
  communication_replied: 'Resposta recebida',
  deal_stage_changed: 'Estágio alterado',
  deal_status_changed: 'Status alterado',
  deal_created: 'Negócio criado',
  deal_lost: 'Negócio perdido',
  deal_reopened: 'Negócio reaberto',
  sla_warning: 'SLA em alerta',
  sla_overdue: 'SLA atrasado',
  sla_escalated: 'SLA escalonado',
  renewal_overdue: 'Renovação sem movimentação',
  reactivation_retry: 'Nova tentativa de reativação',
  target_created: 'Meta criada',
  target_updated: 'Meta atualizada',
  deal_commission_created: 'Comissão do negócio criada',
  commission_created: 'Comissão criada',
  commission_approved: 'Comissão aprovada',
  commission_paid: 'Comissão paga',
  performance_viewed: 'Performance consultada',
  opportunity_created: 'Oportunidade criada',
  opportunity_converted: 'Oportunidade convertida',
  questionnaire_submitted: 'Questionário enviado',
  questionnaire_reviewed: 'Questionário revisado',
  quote_created: 'Cotação criada',
  quote_updated: 'Cotação atualizada',
  quote_sent: 'Cotação enviada',
  quote_compared: 'Comparativo de cotações',
  proposal_created: 'Proposta criada',
  proposal_pdf_generated: 'PDF da proposta gerado',
  proposal_sent: 'Proposta enviada',
  proposal_viewed: 'Proposta visualizada',
  proposal_accepted: 'Proposta aceita',
  proposal_rejected: 'Proposta recusada',
  proposal_expired: 'Proposta expirada',
  deal_won: 'Negócio ganho',
  policy_issued: 'Apólice emitida',
  policy_issuance: 'Emissão de apólice',
  policy_upload: 'Upload de apólice',
  renewal: 'Renovação',
  renewal_started: 'Renovação iniciada',
  renewal_completed: 'Renovação concluída',
  renewal_task_created: 'Tarefa de renovação',
  renewal_reminder_sent: 'Lembrete de renovação',
  renewal_opportunity_created: 'Oportunidade de renovação',
  claim: 'Sinistro',
  follow_up: 'Follow-up operacional',
  billing: 'Cobrança',
  cancellation: 'Cancelamento',
  lifecycle_change: 'Mudança de lifecycle',
};

export function isActivityEventKind(
  value: string | null | undefined,
): value is ActivityEventKind {
  return (
    typeof value === 'string' &&
    (ACTIVITY_EVENT_KINDS as readonly string[]).includes(value)
  );
}

export function activityEventLabel(kind: string | null | undefined): string {
  if (!kind) return 'Evento do sistema';
  if (isActivityEventKind(kind)) return ACTIVITY_EVENT_LABELS[kind];
  return kind.replace(/_/g, ' ');
}

export function isCommercialEventKind(
  value: string | null | undefined,
): value is CommercialEventKind {
  return (
    typeof value === 'string' &&
    (COMMERCIAL_EVENT_KINDS as readonly string[]).includes(value)
  );
}

export function isPostSaleEventKind(
  value: string | null | undefined,
): value is PostSaleEventKind {
  return (
    typeof value === 'string' &&
    (POST_SALE_EVENT_KINDS as readonly string[]).includes(value)
  );
}
