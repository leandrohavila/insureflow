import { apiClient } from "@/lib/data-access/api-client"
import { sortDealsForPipeline } from "@/lib/pipeline-order"

import {
  toCreateDealPayload,
  toPipelineMovePayload,
  toUpdateDealPayload,
} from "./deal-contract"
import { normalizeDeal } from "./normalizers"
import type {
  BackendCrmDeal,
  CreateCrmDealInput,
  DealPipelineUpdateInput,
  UpdateCrmDealInput,
} from "./types"

const CRM_DEALS_PATH = "/api/crm/deals"

export async function fetchDeals() {
  const response = await apiClient.get<
    BackendCrmDeal[] | { data: BackendCrmDeal[] }
  >(CRM_DEALS_PATH)
  const deals = Array.isArray(response) ? response : response.data
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
  const body = toCreateDealPayload(input)
  logDealContractMutation("POST", CRM_DEALS_PATH, body)
  const deal = await apiClient.post<BackendCrmDeal>(CRM_DEALS_PATH, body)
  return normalizeDeal(deal)
}

export async function updateDeal(id: string, input: UpdateCrmDealInput) {
  const path = `${CRM_DEALS_PATH}/${id}`
  const body = toUpdateDealPayload(input)
  logDealContractMutation("PATCH", path, body)
  const deal = await apiClient.patch<BackendCrmDeal>(path, body)
  return normalizeDeal(deal)
}

export async function updateDealPipelinePosition(
  id: string,
  input: DealPipelineUpdateInput,
) {
  const path = `${CRM_DEALS_PATH}/${id}`
  const body = toPipelineMovePayload(input)
  logDealContractMutation("PATCH", path, body)
  const deal = await apiClient.patch<BackendCrmDeal>(path, body)
  return normalizeDeal(deal)
}

export async function deleteDeal(id: string) {
  return apiClient.delete<{ deleted: true; id: string }>(
    `${CRM_DEALS_PATH}/${id}`,
  )
}
