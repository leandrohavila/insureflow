import { apiClient } from "@/lib/data-access/api-client"
import { bug010LeadCreateLog } from "@/lib/performance/bug010-lead-create"

import {
  normalizeConvertLeadResponse,
  normalizeLead,
  normalizeLeadList,
} from "./normalizers"
import { buildCreateLeadPayload } from "./create-lead-payload"
import type {
  BackendConvertLeadResponse,
  BackendLead,
  BackendLeadListResponse,
  ConvertLeadInput,
  CreateLeadRequestInput,
  LeadDuplicatesResponse,
  LeadListFilters,
  UpdateLeadInput,
} from "./types"

const LEADS_PATH = "/api/leads"

function toQueryString(filters: LeadListFilters = {}) {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.status && filters.status !== "all")
    params.set("status", filters.status)
  if (filters.source?.trim()) params.set("source", filters.source.trim())
  if (filters.mine) params.set("mine", "true")
  if (filters.businessUnitId) params.set("businessUnitId", filters.businessUnitId)
  if (filters.interestCategory && filters.interestCategory !== "all") {
    params.set("interestCategory", filters.interestCategory)
  }
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))

  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function fetchLeads(filters: LeadListFilters = {}) {
  const response = await apiClient.get<BackendLeadListResponse>(
    `${LEADS_PATH}${toQueryString(filters)}`,
  )
  const mapStartedAt = performance.now()
  const normalized = normalizeLeadList(response)
  bug010LeadCreateLog("Frontend Map DTO leads", {
    filters,
    mapMs: Number((performance.now() - mapStartedAt).toFixed(2)),
    rows: normalized.data.length,
  })
  return normalized
}

export async function fetchLead(id: string) {
  const lead = await apiClient.get<BackendLead>(`${LEADS_PATH}/${id}`)
  return normalizeLead(lead)
}

export async function fetchLeadDuplicates(
  document: string,
  excludeId?: string,
) {
  const params = new URLSearchParams({ document })
  if (excludeId) params.set("excludeId", excludeId)
  const response = await apiClient.get<LeadDuplicatesResponse>(
    `${LEADS_PATH}/duplicates?${params.toString()}`,
  )
  return response.data ?? []
}

export async function createLead(input: CreateLeadRequestInput) {
  const payload = buildCreateLeadPayload(input)
  const requestStartedAt = performance.now()
  const traceId = input.perfTraceId ?? input.idempotencyKey ?? "lead-create"
  const lead = await apiClient.post<BackendLead>(LEADS_PATH, payload, {
    headers: input.idempotencyKey
      ? { "Idempotency-Key": input.idempotencyKey }
      : undefined,
  })
  bug010LeadCreateLog(
    "POST concluído",
    {
      httpMs: Number((performance.now() - requestStartedAt).toFixed(2)),
      totalSinceSubmitMs: input.perfSubmitStartedAt
        ? Number((performance.now() - input.perfSubmitStartedAt).toFixed(2))
        : undefined,
    },
    traceId,
  )
  return normalizeLead(lead)
}

export async function updateLead(id: string, input: UpdateLeadInput) {
  const lead = await apiClient.patch<BackendLead>(`${LEADS_PATH}/${id}`, input)
  return normalizeLead(lead)
}

export async function deleteLead(id: string) {
  return apiClient.delete<{ deleted: true; id: string }>(`${LEADS_PATH}/${id}`)
}

export async function convertLead(id: string, input: ConvertLeadInput = {}) {
  const response = await apiClient.post<BackendConvertLeadResponse>(
    `${LEADS_PATH}/${id}/convert`,
    input,
  )
  return normalizeConvertLeadResponse(response)
}

export async function linkLeadBusinessUnit(
  leadId: string,
  businessUnitId: string,
) {
  const lead = await apiClient.post<BackendLead>(
    `${LEADS_PATH}/${leadId}/business-units`,
    { businessUnitId },
  )
  return normalizeLead(lead)
}

export async function unlinkLeadBusinessUnit(
  leadId: string,
  businessUnitId: string,
) {
  const lead = await apiClient.delete<BackendLead>(
    `${LEADS_PATH}/${leadId}/business-units/${businessUnitId}`,
  )
  return normalizeLead(lead)
}
