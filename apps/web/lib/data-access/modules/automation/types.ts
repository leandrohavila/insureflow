import type {
  CrossSellStatus,
  MessageChannel,
  ReactivationChannel,
} from "@/lib/business-units/constants"

export type MessageTemplate = {
  id: string
  tenantId: string
  name: string
  channel: MessageChannel
  content: string
  active: boolean
  kind: string
  businessUnitId?: string | null
}

export type CreateMessageTemplateInput = {
  name: string
  channel: MessageChannel
  content: string
  kind?: string
  active?: boolean
  businessUnitId?: string
}

export type LeadReactivationSettings = {
  id: string
  tenantId: string
  enabled: boolean
  idleDays: number
  maxAttempts: number
  channel: ReactivationChannel
  templateId?: string | null
}

export type LeadReactivationMetrics = {
  leadsReactivated: number
  messagesSent: number
  returnedLeads: number
  convertedLeads: number
  returnRate: number
  conversionRate: number
  revenueFromReactivation: number
}

export type CrossSellOpportunity = {
  id: string
  tenantId: string
  customerId: string
  originCategory: string
  suggestedCategory: string
  status: CrossSellStatus
  convertedDealId?: string | null
  convertedRevenue?: number | null
  createdAt: string
  customer?: { id: string; name: string; document: string }
}

export type CrossSellMetrics = {
  generated: number
  converted: number
  conversionRate: number
  revenueFromCrossSell: number
}
