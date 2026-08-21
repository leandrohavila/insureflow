import { apiClient } from "@/lib/data-access/api-client"

export type PerformanceFilters = {
  period?: "month" | "quarter" | "year"
  month?: number
  year?: number
  businessUnitId?: string
  userId?: string
  groupBy?: "broker" | "team" | "company"
}

export type PerformanceDashboard = {
  period: { from: string; to: string; year: number; month: number | null }
  monthRevenue: number
  forecastRevenue: number
  targetRevenue: number
  targetAttainment: number
  commissionForecast: number
  commissionApproved: number
  commissionPaid: number
  wonDeals: number
  avgTicket: number
  conversionRate: number
}

export type PerformanceRankingRow = {
  id: string | null
  name: string
  revenue: number
  wonDeals: number
  commission: number
  conversionRate: number
}

function toQuery(filters: PerformanceFilters) {
  const params = new URLSearchParams()
  if (filters.period) params.set("period", filters.period)
  if (filters.month) params.set("month", String(filters.month))
  if (filters.year) params.set("year", String(filters.year))
  if (filters.businessUnitId) params.set("businessUnitId", filters.businessUnitId)
  if (filters.userId) params.set("userId", filters.userId)
  if (filters.groupBy) params.set("groupBy", filters.groupBy)
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function fetchPerformance(filters: PerformanceFilters = {}) {
  return apiClient.get<PerformanceDashboard>(`/api/performance${toQuery(filters)}`)
}

export async function fetchPerformanceRanking(filters: PerformanceFilters = {}) {
  return apiClient.get<PerformanceRankingRow[]>(
    `/api/performance/ranking${toQuery(filters)}`,
  )
}

export async function fetchSalesTargets(filters: PerformanceFilters = {}) {
  return apiClient.get<
    Array<{
      id: string
      month: number
      year: number
      targetDeals: number
      targetRevenue: number
      achievedDeals: number
      achievedRevenue: number
      attainment: number
      user?: { id: string; name: string } | null
      team?: { id: string; name: string } | null
      businessUnit?: { id: string; name: string } | null
    }>
  >(`/api/sales-targets${toQuery(filters)}`)
}
