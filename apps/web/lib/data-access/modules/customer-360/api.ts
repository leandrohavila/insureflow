import { apiClient } from "@/lib/data-access/api-client"

import type {
  Customer360Payload,
  Dashboard360Filters,
  Dashboard360Metrics,
} from "./types"

export async function fetchCustomer360(id: string) {
  return apiClient.get<Customer360Payload>(`/api/customers/${id}/360`)
}

export async function generateCustomer360(id: string) {
  return apiClient.post<{ created: number }>(
    `/api/customers/${id}/360/generate`,
  )
}

export async function fetchDashboard360(filters: Dashboard360Filters = {}) {
  const params = new URLSearchParams()
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.businessUnitId) params.set("businessUnitId", filters.businessUnitId)
  if (filters.userId) params.set("userId", filters.userId)
  const query = params.toString()
  return apiClient.get<Dashboard360Metrics>(
    `/api/customers/dashboard-360${query ? `?${query}` : ""}`,
  )
}
