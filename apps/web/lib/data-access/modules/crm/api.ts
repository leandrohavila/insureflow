import { apiClient } from "@/lib/data-access/api-client"

import { normalizeDeal } from "./normalizers"
import type {
  BackendCrmDeal,
  CreateCrmDealInput,
  UpdateCrmDealInput,
} from "./types"

const CRM_DEALS_PATH = "/api/crm/deals"

export async function fetchDeals() {
  const deals = await apiClient.get<BackendCrmDeal[]>(CRM_DEALS_PATH)
  return deals.map(normalizeDeal)
}

export async function createDeal(input: CreateCrmDealInput) {
  const deal = await apiClient.post<BackendCrmDeal>(CRM_DEALS_PATH, input)
  return normalizeDeal(deal)
}

export async function updateDeal(id: string, input: UpdateCrmDealInput) {
  const deal = await apiClient.patch<BackendCrmDeal>(
    `${CRM_DEALS_PATH}/${id}`,
    input,
  )
  return normalizeDeal(deal)
}

export async function deleteDeal(id: string) {
  return apiClient.delete<{ deleted: true; id: string }>(
    `${CRM_DEALS_PATH}/${id}`,
  )
}
