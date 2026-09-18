import { apiClient } from "@/lib/data-access/api-client"

import type { CommercialRenewalStatus } from "@/lib/business-units/constants"

import type { PolicyRenewal, UpdatePolicyRenewalInput } from "./types"

const PATH = "/api/policy-renewals"

export async function fetchPolicyRenewals(status?: CommercialRenewalStatus) {
  const query = status ? `?status=${status}` : ""
  const response = await apiClient.get<{ data: PolicyRenewal[] }>(
    `${PATH}${query}`,
  )
  return response.data ?? []
}

export async function updatePolicyRenewal(
  id: string,
  input: UpdatePolicyRenewalInput,
) {
  return apiClient.patch<PolicyRenewal>(`${PATH}/${id}`, input)
}

export type PolicyRenewalFilters = {
  status?: CommercialRenewalStatus
  assignedUserId?: string
  product?: string
  insurer?: string
  company?: string
  dueInDays?: number
  from?: string
  to?: string
  limit?: number
}

export async function fetchPolicyRenewalPortfolio(
  filters: PolicyRenewalFilters = {},
) {
  const params = new URLSearchParams()
  if (filters.status) params.set("status", filters.status)
  if (filters.assignedUserId) params.set("assignedUserId", filters.assignedUserId)
  if (filters.product) params.set("product", filters.product)
  if (filters.insurer) params.set("insurer", filters.insurer)
  if (filters.company) params.set("company", filters.company)
  if (filters.dueInDays) params.set("dueInDays", String(filters.dueInDays))
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  params.set("limit", String(filters.limit ?? 100))
  const response = await apiClient.get<{ data: PolicyRenewal[] }>(
    `${PATH}?${params.toString()}`,
  )
  return response.data ?? []
}

export async function createRenewalDeal(id: string) {
  return apiClient.post<PolicyRenewal>(`${PATH}/${id}/deal`, {})
}

export async function createRenewalActivity(id: string) {
  return apiClient.post<PolicyRenewal>(`${PATH}/${id}/activity`, {})
}
