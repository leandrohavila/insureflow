import { apiClient } from "@/lib/data-access/api-client"

import type {
  CreateLeadFollowUpInput,
  LeadFollowUp,
  LeadFollowUpMetrics,
  LeadFollowUpWindow,
  UpdateLeadFollowUpInput,
} from "./types"

const PATH = "/api/lead-follow-ups"

export async function fetchLeadFollowUps(filters: {
  window?: LeadFollowUpWindow
  assignedUserId?: string
  businessUnitId?: string
} = {}) {
  const params = new URLSearchParams()
  if (filters.window) params.set("window", filters.window)
  if (filters.assignedUserId) params.set("assignedUserId", filters.assignedUserId)
  if (filters.businessUnitId) params.set("businessUnitId", filters.businessUnitId)
  const query = params.toString()
  return apiClient.get<{
    data: LeadFollowUp[]
    metrics: LeadFollowUpMetrics
  }>(`${PATH}${query ? `?${query}` : ""}`)
}

export async function updateLeadFollowUp(
  id: string,
  input: UpdateLeadFollowUpInput,
) {
  return apiClient.patch<LeadFollowUp>(`${PATH}/${id}`, input)
}

export async function createLeadFollowUp(input: CreateLeadFollowUpInput) {
  return apiClient.post<LeadFollowUp>(PATH, input)
}
