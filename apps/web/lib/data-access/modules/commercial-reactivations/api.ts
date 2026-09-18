import { apiClient } from "@/lib/data-access/api-client"

export type ReactivationQueueWindow = "today" | "overdue" | "next7"

export type ReactivationQueueItem = {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string | null
  status: string
  ownerUserId: string | null
  ownerName: string | null
  lossReasonId: string | null
  lossReasonName: string | null
  lostReason: string | null
  lostAt: string | null
  nextReactivationAt: string
  daysOverdue: number
  lastContactAt: string | null
  nextContactAt: string | null
  businessUnitId: string | null
  windowStatus: "today" | "overdue" | "upcoming"
}

export type ReactivationQueueMetrics = {
  today: number
  overdue: number
  next7: number
}

export async function fetchReactivationQueue(filters: {
  window?: ReactivationQueueWindow | ""
  ownerUserId?: string
  lossReasonId?: string
  source?: string
  page?: number
  limit?: number
} = {}) {
  const params = new URLSearchParams()
  if (filters.window) params.set("window", filters.window)
  if (filters.ownerUserId) params.set("ownerUserId", filters.ownerUserId)
  if (filters.lossReasonId) params.set("lossReasonId", filters.lossReasonId)
  if (filters.source) params.set("source", filters.source)
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))
  const query = params.toString()
  return apiClient.get<{
    data: ReactivationQueueItem[]
    metrics: ReactivationQueueMetrics
    meta: { total: number; page: number; limit: number; pageCount: number }
  }>(`/api/commercial-reactivations${query ? `?${query}` : ""}`)
}

export async function reactivateLead(
  leadId: string,
  body: {
    toStatus?: "new" | "contacted" | "qualified"
    nextContactAt?: string
    nextContactType?: "CALL" | "WHATSAPP" | "EMAIL" | "MEETING"
    notes?: string
  } = {},
) {
  return apiClient.post(`/api/commercial-reactivations/${leadId}/reactivate`, body)
}

export async function postponeReactivation(
  leadId: string,
  body: { days?: 7 | 15 | 30; at?: string; reason: string },
) {
  return apiClient.post(`/api/commercial-reactivations/${leadId}/postpone`, body)
}
