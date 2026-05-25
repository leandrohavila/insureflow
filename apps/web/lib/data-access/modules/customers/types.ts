export const CUSTOMER_TYPES = ["PF", "PJ"] as const
export const CUSTOMER_STATUSES = ["active", "inactive", "archived"] as const
export const CUSTOMER_LIFECYCLE_STAGES = [
  "won",
  "onboarding",
  "awaiting_policy",
  "policy_issued",
  "active_customer",
  "inactive_customer",
  "lost_customer",
] as const
export const CUSTOMER_RENEWAL_STATUSES = [
  "pending",
  "in_progress",
  "renewed",
  "lapsed",
  "cancelled",
] as const

export type CustomerType = (typeof CUSTOMER_TYPES)[number]
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]
export type CustomerLifecycleStage = (typeof CUSTOMER_LIFECYCLE_STAGES)[number]
export type CustomerRenewalStatus = (typeof CUSTOMER_RENEWAL_STATUSES)[number]

export type Customer = {
  id: string
  tenantId: string
  type: CustomerType
  name: string
  document: string
  email?: string | null
  phone?: string | null
  status: CustomerStatus
  lifecycleStage: CustomerLifecycleStage
  sourceDealId?: string | null
  companyName?: string | null
  renewalDate?: string | null
  renewalStatus?: CustomerRenewalStatus | null
  renewalPipeline?: string | null
  createdAt: string
  updatedAt: string
  initials: string
}

export type CustomerListFilters = {
  search?: string
  type?: CustomerType | "all"
  status?: CustomerStatus | "all"
  lifecycleStage?: CustomerLifecycleStage | "all"
  renewalStatus?: CustomerRenewalStatus | "all"
  page?: number
  limit?: number
}

export type CustomerListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  counts?: {
    pj: number
    withEmail: number
  }
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
  lifecycleStage?: CustomerLifecycleStage
  companyName?: string
  renewalDate?: string
  renewalStatus?: CustomerRenewalStatus
  renewalPipeline?: string
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>

export type BackendCustomer = Omit<Customer, "initials" | "lifecycleStage"> & {
  lifecycleStage?: CustomerLifecycleStage | null
}

export type BackendCustomerListResponse = {
  data: BackendCustomer[]
  meta: CustomerListMeta
}
