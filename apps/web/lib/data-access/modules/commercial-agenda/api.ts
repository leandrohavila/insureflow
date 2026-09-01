import { apiClient } from "@/lib/data-access/api-client"

export type CommercialAgendaWindow =
  | "today"
  | "overdue"
  | "next7"
  | "next30"
  | "future"
export type CommercialAgendaType =
  | "FOLLOW_UP"
  | "RENEWAL"
  | "REACTIVATION"
  | "SLA"
  | "CALL"
  | "WHATSAPP"
  | "EMAIL"
  | "MEETING"
  | "VISIT"
  | "TASK"

export type CommercialAgendaItem = {
  id: string
  source: "activity" | "follow_up" | "renewal" | "reactivation" | "sla"
  at: string
  type: CommercialAgendaType
  typeLabel: string
  status: string
  origin: string
  customerId: string | null
  customerName: string | null
  leadId: string | null
  leadName: string | null
  dealId: string | null
  ownerName: string | null
  ownerUserId: string | null
  priority: "high" | "medium" | "low"
}

export type CommercialAgendaMetrics = {
  today: number
  overdue: number
  renewalsUpcoming: number
  reactivationsPending: number
  slaOverdue: number
  followUpsPending?: number
  leadsToday?: number
}

export async function fetchCommercialAgenda(filters: {
  window?: CommercialAgendaWindow
  type?: CommercialAgendaType | ""
} = {}) {
  const params = new URLSearchParams()
  if (filters.window) params.set("window", filters.window)
  if (filters.type) params.set("type", filters.type)
  const query = params.toString()
  return apiClient.get<{
    data: CommercialAgendaItem[]
    metrics: CommercialAgendaMetrics
  }>(`/api/commercial-agenda${query ? `?${query}` : ""}`)
}
