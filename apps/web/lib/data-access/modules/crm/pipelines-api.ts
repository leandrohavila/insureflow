import { apiClient } from "@/lib/data-access/api-client"

export type CrmPipelineStage = {
  id: string
  slug: string
  label: string
  sortOrder: number
  maxDays: number | null
  alertTarget: "OWNER" | "MANAGER" | null
  color: string | null
}

export type CrmPipeline = {
  id: string
  tenantId: string
  name: string
  businessUnit: {
    id: string
    name: string
    slug: string
    type: "INSURANCE" | "REAL_ESTATE"
    isActive: boolean
  }
  stages: CrmPipelineStage[]
}

export type ExecutiveDashboard = {
  period: { from: string; to: string }
  leads: number
  opportunities: number
  deals: number
  conversionRate: number
  revenue: number
  renewals: number
  crossSell: number
  avgCloseDays: number
  byBroker: Array<{
    userId: string | null
    name: string
    total: number
    won: number
    revenue: number
    conversionRate: number
  }>
  byCompany: Array<{
    businessUnitId: string | null
    name: string
    total: number
    won: number
    revenue: number
    conversionRate: number
  }>
  funnel: Array<{ stage: string; count: number }>
  revenueInsurance?: number
  revenueRealEstate?: number
  consolidatedRevenue?: number
  consolidatedTarget?: number
  commissionsForecast?: number
  commissionsPaid?: number
  topBrokers?: Array<{
    userId: string | null
    name: string
    revenue: number
    won: number
  }>
  topProducts?: Array<{ productType: string; revenue: number }>
  topLeadSources?: Array<{ sourceType: string; count: number }>
}

export type SlaDashboard = {
  inSla: number
  warning: number
  overdue: number
  openDeals: number
  avgHoursByStage: Array<{ stage: string; label: string; avgHours: number }>
  byBroker: Array<{
    userId: string | null
    name: string
    warning: number
    overdue: number
    total: number
  }>
  byCompany: Array<{
    businessUnitId: string | null
    name: string
    warning: number
    overdue: number
    total: number
  }>
}

export async function fetchCrmPipelines() {
  return apiClient.get<CrmPipeline[]>("/api/crm/pipelines")
}

export async function fetchExecutiveDashboard(filters: {
  from?: string
  to?: string
  businessUnitId?: string
  userId?: string
} = {}) {
  const params = new URLSearchParams()
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.businessUnitId) params.set("businessUnitId", filters.businessUnitId)
  if (filters.userId) params.set("userId", filters.userId)
  const query = params.toString()
  return apiClient.get<ExecutiveDashboard>(
    `/api/crm/dashboard-executivo${query ? `?${query}` : ""}`,
  )
}

export async function fetchSlaDashboard(filters: {
  from?: string
  to?: string
  businessUnitId?: string
  userId?: string
} = {}) {
  const params = new URLSearchParams()
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.businessUnitId) params.set("businessUnitId", filters.businessUnitId)
  if (filters.userId) params.set("userId", filters.userId)
  const query = params.toString()
  return apiClient.get<SlaDashboard>(
    `/api/crm/dashboard-sla${query ? `?${query}` : ""}`,
  )
}
