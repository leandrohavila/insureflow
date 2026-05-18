export const CUSTOMER_TYPES = ["PF", "PJ"] as const
export const CUSTOMER_STATUSES = ["active", "inactive", "archived"] as const

export type CustomerType = (typeof CUSTOMER_TYPES)[number]
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

export type Customer = {
  id: string
  tenantId: string
  type: CustomerType
  name: string
  document: string
  email?: string | null
  phone?: string | null
  status: CustomerStatus
  createdAt: string
  updatedAt: string
  initials: string
}

export type CustomerListFilters = {
  search?: string
  type?: CustomerType | "all"
  status?: CustomerStatus | "all"
  page?: number
  limit?: number
}

export type CustomerListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type CustomerListResponse = {
  data: Customer[]
  meta: CustomerListMeta
}

export type CreateCustomerInput = {
  type: CustomerType
  name: string
  document: string
  email?: string
  phone?: string
  status: CustomerStatus
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>

export type BackendCustomer = Omit<Customer, "initials">

export type BackendCustomerListResponse = {
  data: BackendCustomer[]
  meta: CustomerListMeta
}
