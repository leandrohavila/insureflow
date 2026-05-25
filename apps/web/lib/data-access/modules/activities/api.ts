import { apiClient } from "@/lib/data-access/api-client"

import { normalizeActivity, normalizeActivityList } from "./normalizers"
import type {
  ActivityListFilters,
  BackendActivity,
  BackendActivityListResponse,
  CreateActivityInput,
  UpdateActivityInput,
} from "./types"

const ACTIVITIES_PATH = "/api/activities"

function toQueryString(filters: ActivityListFilters = {}) {
  const params = new URLSearchParams()

  if (filters.status) params.set("status", filters.status)
  if (filters.leadId) params.set("leadId", filters.leadId)
  if (filters.dealId) params.set("dealId", filters.dealId)
  if (filters.customerId) params.set("customerId", filters.customerId)
  if (filters.type) params.set("type", filters.type)
  if (filters.occurredAtFrom) params.set("occurredAtFrom", filters.occurredAtFrom)
  if (filters.occurredAtTo) params.set("occurredAtTo", filters.occurredAtTo)
  if (filters.nextFollowUpFrom)
    params.set("nextFollowUpFrom", filters.nextFollowUpFrom)
  if (filters.nextFollowUpTo) params.set("nextFollowUpTo", filters.nextFollowUpTo)
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))

  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function fetchActivities(filters: ActivityListFilters = {}) {
  const response = await apiClient.get<BackendActivityListResponse>(
    `${ACTIVITIES_PATH}${toQueryString(filters)}`,
  )
  return normalizeActivityList(response)
}

export async function fetchActivity(id: string) {
  const response = await apiClient.get<BackendActivity>(
    `${ACTIVITIES_PATH}/${id}`,
  )
  return normalizeActivity(response)
}

export async function createActivity(input: CreateActivityInput) {
  const response = await apiClient.post<BackendActivity>(
    ACTIVITIES_PATH,
    input,
  )
  return normalizeActivity(response)
}

export async function updateActivity(id: string, input: UpdateActivityInput) {
  const response = await apiClient.patch<BackendActivity>(
    `${ACTIVITIES_PATH}/${id}`,
    input,
  )
  return normalizeActivity(response)
}

export async function deleteActivity(id: string) {
  await apiClient.delete(`${ACTIVITIES_PATH}/${id}`)
}
