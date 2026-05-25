import { apiClient } from "@/lib/data-access/api-client"

import { normalizeCustomer, normalizeCustomerList } from "./normalizers"
import type {
  BackendCustomer,
  BackendCustomerListResponse,
  CreateCustomerInput,
  CustomerListFilters,
  UpdateCustomerInput,
} from "./types"

const CUSTOMERS_PATH = "/api/customers"

function toQueryString(filters: CustomerListFilters = {}) {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.type && filters.type !== "all") params.set("type", filters.type)
  if (filters.status && filters.status !== "all")
    params.set("status", filters.status)
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))

  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function fetchCustomers(filters: CustomerListFilters = {}) {
  const response = await apiClient.get<BackendCustomerListResponse>(
    `${CUSTOMERS_PATH}${toQueryString(filters)}`,
  )
  return normalizeCustomerList(response)
}

export async function fetchCustomer(id: string) {
  const customer = await apiClient.get<BackendCustomer>(
    `${CUSTOMERS_PATH}/${id}`,
  )
  return normalizeCustomer(customer)
}

export async function createCustomer(input: CreateCustomerInput) {
  const customer = await apiClient.post<BackendCustomer>(CUSTOMERS_PATH, input)
  return normalizeCustomer(customer)
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const customer = await apiClient.patch<BackendCustomer>(
    `${CUSTOMERS_PATH}/${id}`,
    input,
  )
  return normalizeCustomer(customer)
}

export async function deleteCustomer(id: string) {
  return apiClient.delete<{ deleted: true; id: string }>(
    `${CUSTOMERS_PATH}/${id}`,
  )
}
