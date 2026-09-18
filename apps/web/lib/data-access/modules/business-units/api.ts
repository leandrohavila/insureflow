import { apiClient } from "@/lib/data-access/api-client"

import type {
  BusinessUnit,
  CreateBusinessUnitInput,
  UpdateBusinessUnitInput,
  BusinessUnitContext,
} from "./types"

const PATH = "/api/business-units"

export async function fetchBusinessUnits() {
  const response = await apiClient.get<{ data: BusinessUnit[] }>(PATH)
  return response.data ?? []
}

export async function createBusinessUnit(input: CreateBusinessUnitInput) {
  return apiClient.post<BusinessUnit>(PATH, input)
}

export async function updateBusinessUnit(
  id: string,
  input: UpdateBusinessUnitInput,
) {
  return apiClient.patch<BusinessUnit>(`${PATH}/${id}`, input)
}

export async function deleteBusinessUnit(id: string) {
  return apiClient.delete<{ deleted: true; id: string }>(`${PATH}/${id}`)
}

export async function fetchBusinessUnitContext() {
  return apiClient.get<BusinessUnitContext>(`${PATH}/context`)
}

export async function updateBusinessUnitContext(businessUnitId: string | null) {
  return apiClient.patch<BusinessUnitContext>(`${PATH}/context`, {
    businessUnitId,
  })
}
