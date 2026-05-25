import { apiClient } from "@/lib/data-access/api-client"

import {
  normalizeConvertLeadResponse,
  normalizeLead,
  normalizeLeadList,
} from "./normalizers"
import type {
  BackendConvertLeadResponse,
  BackendLead,
  BackendLeadListResponse,
  ConvertLeadInput,
  CreateLeadInput,
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
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))

  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function fetchLeads(filters: LeadListFilters = {}) {
  const response = await apiClient.get<BackendLeadListResponse>(
    `${LEADS_PATH}${toQueryString(filters)}`,
  )
  return normalizeLeadList(response)
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

export async function createLead(input: CreateLeadInput) {
  const lead = await apiClient.post<BackendLead>(LEADS_PATH, input)
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
