import { apiClient } from "@/lib/data-access/api-client"

import type {
  CommercialDashboardFilters,
  CommercialDashboardMetrics,
} from "./types"

export async function fetchCommercialDashboard(
  filters: CommercialDashboardFilters = {},
) {
  const params = new URLSearchParams()
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.userId) params.set("userId", filters.userId)
  if (filters.teamId) params.set("teamId", filters.teamId)
  if (filters.businessUnitId) params.set("businessUnitId", filters.businessUnitId)
  const query = params.toString()
  return apiClient.get<CommercialDashboardMetrics>(
    `/api/commercial/dashboard${query ? `?${query}` : ""}`,
  )
}
