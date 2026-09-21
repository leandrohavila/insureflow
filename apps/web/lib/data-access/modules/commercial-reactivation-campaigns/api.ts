import { apiClient } from "@/lib/data-access/api-client"

export type CampaignStatus = "DRAFT" | "IN_PROGRESS" | "FINISHED"

export type CampaignLeadContactStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "NO_RESPONSE"
  | "INTERESTED"
  | "REACTIVATED"
  | "CLOSED"

export type ReactivationCampaign = {
  id: string
  name: string
  description: string | null
  status: CampaignStatus
  createdAt: string
  ownerUserId: string
  ownerName: string
  createdByName: string | null
  totalLeads: number
  contacted: number
  reactivated: number
  conversionRate: number
}

export type CampaignLeadRow = {
  id: string
  leadId: string
  name: string
  phone: string | null
  email: string | null
  source: string | null
  company: string | null
  lossReasonName: string | null
  lostAt: string | null
  ownerName: string | null
  ownerUserId: string | null
  contactStatus: CampaignLeadContactStatus
  contactedAt: string | null
  reactivatedAt: string | null
  notes: string | null
  addedAt: string
  addedByName: string | null
}

export type ReactivationCampaignDetail = ReactivationCampaign & {
  startedAt: string | null
  finishedAt: string | null
  businessUnitId: string | null
  businessUnitName: string | null
  leads: CampaignLeadRow[]
}

export type LeadSelectionFilters = {
  lossReasonId?: string
  source?: string
  ownerUserId?: string
  company?: string
  businessUnitId?: string
  lostDays?: 30 | 60 | 90 | 180
  leadIds?: string[]
}

const PATH = "/api/commercial-reactivation-campaigns"

export async function fetchReactivationCampaigns(filters: {
  status?: CampaignStatus | ""
  page?: number
  limit?: number
} = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set("status", filters.status)
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))
  const query = params.toString()
  return apiClient.get<{
    data: ReactivationCampaign[]
    meta: { total: number; page: number; limit: number; pageCount: number }
  }>(`${PATH}${query ? `?${query}` : ""}`)
}

export async function fetchReactivationCampaign(id: string) {
  return apiClient.get<ReactivationCampaignDetail>(`${PATH}/${id}`)
}

export async function createReactivationCampaign(body: {
  name: string
  description?: string
  ownerUserId?: string
  businessUnitId?: string
}) {
  return apiClient.post<ReactivationCampaign>(PATH, body)
}

export async function updateReactivationCampaign(
  id: string,
  body: {
    name?: string
    description?: string | null
    ownerUserId?: string
  },
) {
  return apiClient.patch<ReactivationCampaign>(`${PATH}/${id}`, body)
}

export async function startReactivationCampaign(id: string) {
  return apiClient.post<ReactivationCampaignDetail>(`${PATH}/${id}/start`)
}

export async function finishReactivationCampaign(id: string) {
  return apiClient.post<ReactivationCampaignDetail>(`${PATH}/${id}/finish`)
}

export async function previewCampaignLeads(
  id: string,
  filters: LeadSelectionFilters,
) {
  return apiClient.post<{ total: number }>(`${PATH}/${id}/preview-leads`, filters)
}

export async function addCampaignLeads(
  id: string,
  filters: LeadSelectionFilters,
) {
  return apiClient.post<{ added: number; total: number }>(
    `${PATH}/${id}/add-leads`,
    filters,
  )
}

export async function removeCampaignLead(
  campaignId: string,
  campaignLeadId: string,
) {
  return apiClient.delete<{ deleted: true; id: string }>(
    `${PATH}/${campaignId}/leads/${campaignLeadId}`,
  )
}

export async function updateCampaignLead(
  campaignId: string,
  campaignLeadId: string,
  body: { contactStatus?: CampaignLeadContactStatus; notes?: string },
) {
  return apiClient.patch(`${PATH}/${campaignId}/leads/${campaignLeadId}`, body)
}

export async function reactivateCampaignLead(
  campaignId: string,
  campaignLeadId: string,
  body: { toStatus?: string; notes?: string } = {},
) {
  return apiClient.post(
    `${PATH}/${campaignId}/leads/${campaignLeadId}/reactivate`,
    body,
  )
}
