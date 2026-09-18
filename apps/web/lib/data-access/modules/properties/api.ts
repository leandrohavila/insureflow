import { apiClient } from "@/lib/data-access/api-client"

import type {
  CreatePropertyInput,
  Person,
  Property,
  PropertyLead,
  PropertyLeadListItem,
  PropertyListFilters,
  PropertyListResponse,
  RealEstateDashboardStats,
  UpdatePropertyInput,
} from "./types"

const PROPERTIES_PATH = "/api/properties"
const PERSONS_PATH = "/api/persons"

function toQueryString(filters: PropertyListFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.businessUnitId) params.set("businessUnitId", filters.businessUnitId)
  if (filters.purpose) params.set("purpose", filters.purpose)
  if (filters.city?.trim()) params.set("city", filters.city.trim())
  if (filters.neighborhood?.trim()) {
    params.set("neighborhood", filters.neighborhood.trim())
  }
  if (filters.published != null) {
    params.set("published", String(filters.published))
  }
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))
  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function fetchProperties(filters: PropertyListFilters = {}) {
  return apiClient.get<PropertyListResponse>(
    `${PROPERTIES_PATH}${toQueryString(filters)}`,
  )
}

export async function fetchProperty(id: string) {
  return apiClient.get<Property>(`${PROPERTIES_PATH}/${id}`)
}

export async function createProperty(input: CreatePropertyInput) {
  return apiClient.post<Property>(PROPERTIES_PATH, input)
}

export async function updateProperty(id: string, input: UpdatePropertyInput) {
  return apiClient.patch<Property>(`${PROPERTIES_PATH}/${id}`, input)
}

export async function deleteProperty(id: string) {
  return apiClient.delete<{ ok: boolean }>(`${PROPERTIES_PATH}/${id}`)
}

export async function publishProperty(id: string) {
  return apiClient.post<Property>(`${PROPERTIES_PATH}/${id}/publish`, {})
}

export async function unpublishProperty(id: string) {
  return apiClient.post<Property>(`${PROPERTIES_PATH}/${id}/unpublish`, {})
}

export async function fetchPropertyLeads(propertyId: string) {
  return apiClient.get<PropertyLead[]>(`${PROPERTIES_PATH}/${propertyId}/leads`)
}

export async function fetchAllPropertyLeads(businessUnitId?: string) {
  const query = businessUnitId
    ? `?businessUnitId=${encodeURIComponent(businessUnitId)}`
    : ""
  return apiClient.get<PropertyLeadListItem[]>(`${PROPERTIES_PATH}/leads${query}`)
}

export async function fetchRealEstateDashboardStats(businessUnitId?: string) {
  const query = businessUnitId
    ? `?businessUnitId=${encodeURIComponent(businessUnitId)}`
    : ""
  return apiClient.get<RealEstateDashboardStats>(
    `${PROPERTIES_PATH}/dashboard-stats${query}`,
  )
}

export async function uploadPropertyImages(propertyId: string, files: File[]) {
  const formData = new FormData()
  for (const file of files) {
    formData.append("files", file)
  }
  return apiClient.post<Property>(
    `${PROPERTIES_PATH}/${propertyId}/images/upload`,
    undefined,
    { body: formData },
  )
}

export async function reorderPropertyImages(
  propertyId: string,
  imageIds: string[],
) {
  return apiClient.patch<Property>(`${PROPERTIES_PATH}/${propertyId}/images/order`, {
    imageIds,
  })
}

export async function setPropertyCoverImage(propertyId: string, imageId: string) {
  return apiClient.post<Property>(
    `${PROPERTIES_PATH}/${propertyId}/images/${imageId}/cover`,
    {},
  )
}

export async function deletePropertyImage(propertyId: string, imageId: string) {
  return apiClient.delete<{ ok: boolean }>(
    `${PROPERTIES_PATH}/${propertyId}/images/${imageId}`,
  )
}

export async function fetchPersons(search?: string) {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""
  return apiClient.get<Person[]>(`${PERSONS_PATH}${query}`)
}
