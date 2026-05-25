import { apiClient } from "@/lib/data-access/api-client"
import { sortDealsForPipeline } from "@/lib/pipeline-order"

import { normalizeDeal } from "./normalizers"
import type {
  BackendCrmDeal,
  CreateCrmDealInput,
  UpdateCrmDealInput,
} from "./types"

const CRM_DEALS_PATH = "/api/crm/deals"

export async function fetchDeals() {
  const deals = await apiClient.get<BackendCrmDeal[]>(CRM_DEALS_PATH)
  return sortDealsForPipeline(deals.map(normalizeDeal))
}

function logDealContractMutation(
  method: "POST" | "PATCH",
  path: string,
  body: unknown,
) {
  if (process.env.NEXT_PUBLIC_DEAL_CONTRACT_DEBUG !== "1") return
  console.debug(`[deal-contract][mutation.${method}]`, path, body)
}

export async function createDeal(input: CreateCrmDealInput) {
  logDealContractMutation("POST", CRM_DEALS_PATH, input)
  const deal = await apiClient.post<BackendCrmDeal>(CRM_DEALS_PATH, input)
  return normalizeDeal(deal)
}

export async function updateDeal(id: string, input: UpdateCrmDealInput) {
  const path = `${CRM_DEALS_PATH}/${id}`
  logDealContractMutation("PATCH", path, input)
  const deal = await apiClient.patch<BackendCrmDeal>(path, input)
  return normalizeDeal(deal)
}

export async function deleteDeal(id: string) {
  return apiClient.delete<{ deleted: true; id: string }>(
    `${CRM_DEALS_PATH}/${id}`,
  )
}
