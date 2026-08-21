import { apiClient } from "@/lib/data-access/api-client"

import type {
  CreateMessageTemplateInput,
  CrossSellMetrics,
  CrossSellOpportunity,
  LeadReactivationMetrics,
  LeadReactivationSettings,
  MessageTemplate,
} from "./types"
import type { CrossSellStatus } from "@/lib/business-units/constants"

export async function fetchMessageTemplates() {
  const response = await apiClient.get<{ data: MessageTemplate[] }>(
    "/api/message-templates",
  )
  return response.data ?? []
}

export async function createMessageTemplate(input: CreateMessageTemplateInput) {
  return apiClient.post<MessageTemplate>("/api/message-templates", input)
}

export async function updateMessageTemplate(
  id: string,
  input: Partial<CreateMessageTemplateInput>,
) {
  return apiClient.patch<MessageTemplate>(`/api/message-templates/${id}`, input)
}

export async function deleteMessageTemplate(id: string) {
  return apiClient.delete<{ deleted: true; id: string }>(
    `/api/message-templates/${id}`,
  )
}

export async function fetchReactivationSettings() {
  return apiClient.get<LeadReactivationSettings>(
    "/api/automation/reactivation/settings",
  )
}

export async function updateReactivationSettings(
  input: Partial<LeadReactivationSettings>,
) {
  return apiClient.post<LeadReactivationSettings>(
    "/api/automation/reactivation/settings",
    input,
  )
}

export async function fetchReactivationMetrics() {
  return apiClient.get<LeadReactivationMetrics>(
    "/api/automation/reactivation/metrics",
  )
}

export async function runReactivationNow() {
  return apiClient.post<{ processed: number; sent: number }>(
    "/api/automation/reactivation/run",
    {},
  )
}

export async function fetchCrossSellOpportunities(status?: CrossSellStatus) {
  const query = status ? `?status=${status}` : ""
  const response = await apiClient.get<{ data: CrossSellOpportunity[] }>(
    `/api/cross-sell/opportunities${query}`,
  )
  return response.data ?? []
}

export async function updateCrossSellOpportunity(
  id: string,
  input: { status?: CrossSellStatus; convertedRevenue?: number },
) {
  return apiClient.patch<CrossSellOpportunity>(
    `/api/cross-sell/opportunities/${id}`,
    input,
  )
}

export async function fetchCrossSellMetrics() {
  return apiClient.get<CrossSellMetrics>("/api/cross-sell/metrics")
}

export async function generateCrossSell() {
  return apiClient.post<{ created: number }>("/api/cross-sell/generate", {})
}
