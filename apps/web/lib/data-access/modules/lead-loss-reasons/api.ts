import { apiClient } from "@/lib/data-access/api-client"

import type {
  CreateLeadLossReasonInput,
  LeadLossReason,
  UpdateLeadLossReasonInput,
} from "./types"

const PATH = "/api/lead-loss-reasons"

export async function fetchLeadLossReasons(active?: boolean) {
  const query = active === undefined ? "" : `?active=${active}`
  const response = await apiClient.get<{ data: LeadLossReason[] }>(
    `${PATH}${query}`,
  )
  return response.data ?? []
}

export async function createLeadLossReason(input: CreateLeadLossReasonInput) {
  return apiClient.post<LeadLossReason>(PATH, input)
}

export async function updateLeadLossReason(
  id: string,
  input: UpdateLeadLossReasonInput,
) {
  return apiClient.patch<LeadLossReason>(`${PATH}/${id}`, input)
}

export async function deleteLeadLossReason(id: string) {
  return apiClient.delete<{ deleted: true; id: string }>(`${PATH}/${id}`)
}
