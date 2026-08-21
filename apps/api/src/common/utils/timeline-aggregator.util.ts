export const CUSTOMER_360_EVENT_KINDS = [
  'lead_created',
  'lead_converted',
  'message_sent',
  'message_received',
  'follow_up_created',
  'follow_up_completed',
  'renewal_created',
  'renewal_converted',
  'cross_sell_created',
  'cross_sell_converted',
  'owner_changed',
  'business_unit_changed',
  'stage_changed',
  'opportunity_created',
  'opportunity_converted',
  'deal_created',
  'deal_won',
  'deal_lost',
  'deal_reopened',
  'sla_warning',
  'sla_overdue',
  'sla_escalated',
  'renewal_overdue',
  'reactivation_retry',
] as const;

export type Customer360EventKind = (typeof CUSTOMER_360_EVENT_KINDS)[number];

export const CUSTOMER_360_EVENT_LABELS: Record<Customer360EventKind, string> = {
  lead_created: 'Lead criado',
  lead_converted: 'Lead convertido',
  message_sent: 'Mensagem enviada',
  message_received: 'Mensagem recebida',
  follow_up_created: 'Follow-up criado',
  follow_up_completed: 'Follow-up concluído',
  renewal_created: 'Renovação criada',
  renewal_converted: 'Renovação convertida',
  cross_sell_created: 'Cross-sell criado',
  cross_sell_converted: 'Cross-sell convertido',
  owner_changed: 'Alteração de responsável',
  business_unit_changed: 'Mudança de empresa',
  stage_changed: 'Mudança de estágio',
  opportunity_created: 'Oportunidade criada',
  opportunity_converted: 'Oportunidade convertida',
  deal_created: 'Negócio criado',
  deal_won: 'Negócio ganho',
  deal_lost: 'Negócio perdido',
  deal_reopened: 'Negócio reaberto',
  sla_warning: 'SLA em alerta',
  sla_overdue: 'SLA atrasado',
  sla_escalated: 'SLA escalonado',
  renewal_overdue: 'Renovação sem movimentação',
  reactivation_retry: 'Nova tentativa de reativação',
};

export type TimelineEventInput = {
  id: string;
  occurredAt: Date | string;
  kind: Customer360EventKind;
  title?: string;
  description?: string | null;
  source?: string;
  metadata?: Record<string, unknown>;
};

export type TimelineEvent = {
  id: string;
  occurredAt: string;
  kind: Customer360EventKind;
  title: string;
  description: string | null;
  source: string;
  metadata: Record<string, unknown>;
};

export function aggregateCustomerTimeline(
  inputs: TimelineEventInput[],
): TimelineEvent[] {
  return inputs
    .map((item) => ({
      id: item.id,
      occurredAt: toIso(item.occurredAt),
      kind: item.kind,
      title: item.title?.trim() || CUSTOMER_360_EVENT_LABELS[item.kind],
      description: item.description?.trim() || null,
      source: item.source ?? 'system',
      metadata: item.metadata ?? {},
    }))
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
}

export function mapActivityKindTo360(
  operationalEventKind: string | null | undefined,
): Customer360EventKind | null {
  switch (operationalEventKind) {
    case 'lead_converted':
      return 'lead_converted';
    case 'communication_sent':
    case 'communication_delivered':
    case 'communication_read':
      return 'message_sent';
    case 'communication_replied':
      return 'message_received';
    case 'lead_follow_up_scheduled':
      return 'follow_up_created';
    case 'lead_follow_up_completed':
      return 'follow_up_completed';
    case 'renewal_started':
    case 'renewal_opportunity_created':
    case 'renewal_task_created':
      return 'renewal_created';
    case 'renewal_completed':
      return 'renewal_converted';
    case 'deal_created':
      return 'deal_created';
    case 'deal_won':
      return 'deal_won';
    case 'deal_lost':
      return 'deal_lost';
    case 'deal_reopened':
      return 'deal_reopened';
    case 'sla_warning':
      return 'sla_warning';
    case 'sla_overdue':
      return 'sla_overdue';
    case 'sla_escalated':
      return 'sla_escalated';
    case 'renewal_overdue':
      return 'renewal_overdue';
    case 'reactivation_retry':
      return 'reactivation_retry';
    case 'deal_stage_changed':
    case 'deal_status_changed':
      return 'stage_changed';
    case 'lead_business_unit_linked':
      return 'business_unit_changed';
    case 'opportunity_created':
      return 'opportunity_created';
    case 'opportunity_converted':
      return 'opportunity_converted';
    case 'owner_changed':
      return 'owner_changed';
    default:
      return null;
  }
}

function toIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date(0).toISOString()
    : parsed.toISOString();
}
