import type { BusinessUnitSummary } from "@/lib/data-access/modules/business-units/types"
import type {
  OpportunityScore,
  OpportunityStatus,
  OpportunityType,
} from "@/lib/crm/opportunity"

export type Customer360Unit = BusinessUnitSummary

export type Customer360TimelineEvent = {
  id: string
  occurredAt: string
  kind: string
  title: string
  description: string | null
  source: string
}

export type Customer360Lead = {
  id: string
  name: string
  status: string
  phone?: string | null
  email?: string | null
  owner?: string | null
  businessUnit?: Customer360Unit | null
  createdAt: string
}

export type Customer360Deal = {
  id: string
  title: string
  value: number
  stage: string
  status: string
  owner?: string | null
  businessUnit?: Customer360Unit | null
  sourceType?: string | null
  score?: string | null
  pipelineName?: string | null
  createdAt: string
}

export type Customer360Policy = {
  id: string
  policyNumber: string
  insurer: string
  productLine: string
  status: string
  premiumValue: number
  effectiveFrom?: string | null
  effectiveTo: string | null
}

export type Customer360Property = {
  id: string
  kind: "deal" | "opportunity"
  title: string
  value: number | null
  status: string
  businessUnit?: Customer360Unit | null
}

export type Customer360Communication = {
  id: string
  purpose: string
  status: string
  channel: string
  content: string
  direction: string
  createdAt: string
}

export type Customer360FollowUp = {
  id: string
  type: string
  status: string
  scheduledAt: string
  leadName: string
}

export type Customer360Renewal = {
  id: string
  policyNumber: string
  product: string
  insurer?: string
  status: string
  startDate?: string
  endDate?: string
  renewalDate: string
  convertedRevenue?: number | null
}

export type Customer360AgendaItem = {
  id: string
  type: string
  status: string
  subject: string
  at: string
}

export type Customer360CrossSell = {
  id: string
  originCategory: string
  suggestedCategory: string
  status: string
  convertedRevenue: number | null
  createdAt: string
}

export type Customer360Opportunity = {
  id: string
  type: OpportunityType | string
  status: OpportunityStatus | string
  score: OpportunityScore | string
  source: string
  estimatedValue: number | null
  assignedUser?: { id: string; name: string } | null
  businessUnit?: Customer360Unit | null
  createdAt: string
}

export type Customer360Pendency = {
  id: string
  kind: "sla_overdue" | "renewal_pending" | "follow_up_pending" | "cross_sell_pending"
  title: string
  detail: string
}

export type Customer360Customer = {
  id: string
  name: string
  type?: string
  document?: string | null
  email?: string | null
  phone?: string | null
  phones?: string[]
  emails?: string[]
  companyName?: string | null
  status?: string
  interestCategories?: string[]
  ownerUser?: { id: string; name: string } | null
  businessUnit?: Customer360Unit | null
  businessUnits?: Customer360Unit[]
}

export type Customer360Payload = {
  customer: Customer360Customer
  /** Domínios futuros: seguros, imóveis, leads e oportunidades no mesmo 360. */
  timeline: Customer360TimelineEvent[]
  leads: Customer360Lead[]
  deals: Customer360Deal[]
  policies: Customer360Policy[]
  properties: Customer360Property[]
  communications: Customer360Communication[]
  followUps: Customer360FollowUp[]
  renewals: Customer360Renewal[]
  agenda?: {
    upcoming: Customer360AgendaItem[]
    completed: Customer360AgendaItem[]
  }
  renewalBook?: {
    totalInsured: number
    generatedRevenue: number
    past: number
    upcoming: number
  }
  crossSell: Customer360CrossSell[]
  opportunities: Customer360Opportunity[]
  pendencies: Customer360Pendency[]
  finance?: {
    generatedRevenue: number
    closedDeals: number
    commissions: Array<{
      id: string
      dealTitle: string
      value: number
      percentage: number
      status: string
      createdAt: string
    }>
    products: string[]
    history: Array<{
      id: string
      kind: "deal" | "commission"
      title: string
      amount: number
      occurredAt: string
    }>
  }
}

export type Dashboard360Metrics = {
  period: { from: string; to: string }
  activeCustomers: number
  inactiveCustomers: number
  reactivatedCustomers: number
  predictedRevenue: number
  renewalRevenue: number
  crossSellRevenue: number
  openOpportunities: number
  conversionRate: number
  brokers: Array<{ id: string; name: string }>
}

export type Dashboard360Filters = {
  from?: string
  to?: string
  businessUnitId?: string
  userId?: string
}
