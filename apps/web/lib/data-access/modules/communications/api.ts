import { apiClient } from "@/lib/data-access/api-client"

import type {
  CommunicationDashboard,
  CommunicationDashboardFilters,
  CommunicationListFilters,
  CommunicationLog,
  CommunicationProviderConfig,
  EvolutionActionResult,
  EvolutionQrResult,
  RecordCommunicationReplyInput,
  SendCommunicationInput,
  UpdateCommunicationProviderInput,
} from "./types"

const PATH = "/api/communications"

function toQuery(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function fetchCommunications(filters: CommunicationListFilters = {}) {
  return apiClient.get<{
    data: CommunicationLog[]
    meta: { page: number; limit: number; total: number; totalPages: number }
  }>(
    `${PATH}${toQuery({
      purpose: filters.purpose,
      status: filters.status,
      channel: filters.channel,
      provider: filters.provider,
      userId: filters.userId,
      businessUnitId: filters.businessUnitId,
      from: filters.from,
      to: filters.to,
      page: filters.page ? String(filters.page) : undefined,
    })}`,
  )
}

export async function fetchCommunicationsDashboard(
  filters: CommunicationDashboardFilters = {},
) {
  return apiClient.get<CommunicationDashboard>(
    `${PATH}/dashboard${toQuery({
      purpose: filters.purpose,
      userId: filters.userId,
      businessUnitId: filters.businessUnitId,
      from: filters.from,
      to: filters.to,
    })}`,
  )
}

export async function fetchCommunicationProvider() {
  return apiClient.get<CommunicationProviderConfig>(`${PATH}/provider`)
}

export async function updateCommunicationProvider(
  input: UpdateCommunicationProviderInput,
) {
  return apiClient.patch<CommunicationProviderConfig>(
    `${PATH}/provider`,
    input,
  )
}

export async function fetchEvolutionHealth() {
  return apiClient.get<EvolutionActionResult>(`${PATH}/evolution/health`)
}

export async function connectEvolution() {
  return apiClient.post<EvolutionActionResult>(`${PATH}/evolution/connect`, {})
}

export async function reconnectEvolution() {
  return apiClient.post<EvolutionActionResult>(`${PATH}/evolution/reconnect`, {})
}

export async function disconnectEvolution() {
  return apiClient.post<EvolutionActionResult>(
    `${PATH}/evolution/disconnect`,
    {},
  )
}

export async function generateEvolutionQr() {
  return apiClient.post<EvolutionQrResult>(`${PATH}/evolution/qrcode`, {})
}

export async function sendCommunication(input: SendCommunicationInput) {
  return apiClient.post<CommunicationLog>(`${PATH}/send`, input)
}

export async function recordCommunicationReply(
  id: string,
  input: RecordCommunicationReplyInput,
) {
  return apiClient.post<CommunicationLog>(`${PATH}/${id}/reply`, input)
}
