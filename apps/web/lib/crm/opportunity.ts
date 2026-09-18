export const OPPORTUNITY_TYPES = [
  "AUTO_INSURANCE",
  "LIFE_INSURANCE",
  "HEALTH_INSURANCE",
  "HOME_INSURANCE",
  "PROPERTY_BUY",
  "PROPERTY_SELL",
  "PROPERTY_RENT",
] as const
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number]

export const OPPORTUNITY_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WON",
  "LOST",
  "DISMISSED",
] as const
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number]

export const OPPORTUNITY_SCORES = ["LOW", "MEDIUM", "HIGH"] as const
export type OpportunityScore = (typeof OPPORTUNITY_SCORES)[number]

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  AUTO_INSURANCE: "Seguro Auto",
  LIFE_INSURANCE: "Seguro de Vida",
  HEALTH_INSURANCE: "Seguro Saúde",
  HOME_INSURANCE: "Seguro Residencial",
  PROPERTY_BUY: "Compra de imóvel",
  PROPERTY_SELL: "Venda de imóvel",
  PROPERTY_RENT: "Locação de imóvel",
}

export const OPPORTUNITY_SCORE_LABELS: Record<OpportunityScore, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
}

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  WON: "Convertida",
  LOST: "Perdida",
  DISMISSED: "Descartada",
}

export const CUSTOMER_360_EVENT_LABELS: Record<string, string> = {
  lead_created: "Lead criado",
  lead_converted: "Lead convertido",
  message_sent: "Mensagem enviada",
  message_received: "Mensagem recebida",
  follow_up_created: "Follow-up criado",
  follow_up_completed: "Follow-up concluído",
  renewal_created: "Renovação criada",
  renewal_converted: "Renovação convertida",
  cross_sell_created: "Cross-sell criado",
  cross_sell_converted: "Cross-sell convertido",
  owner_changed: "Alteração de responsável",
  business_unit_changed: "Mudança de empresa",
  stage_changed: "Mudança de estágio",
  opportunity_created: "Oportunidade criada",
  opportunity_converted: "Oportunidade convertida",
  deal_created: "Negócio criado",
  deal_won: "Negócio ganho",
  deal_lost: "Negócio perdido",
  deal_reopened: "Negócio reaberto",
  sla_warning: "SLA em alerta",
  sla_overdue: "SLA atrasado",
  sla_escalated: "SLA escalonado",
  renewal_overdue: "Renovação sem movimentação",
  reactivation_retry: "Nova tentativa de reativação",
}

export function opportunityTypeLabel(value: string) {
  return OPPORTUNITY_TYPE_LABELS[value as OpportunityType] ?? value
}
