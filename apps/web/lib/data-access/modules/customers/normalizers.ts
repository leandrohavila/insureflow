import type {
  BackendCustomer,
  BackendCustomerListResponse,
  Customer,
  CustomerListResponse,
} from "./types"

function initials(value: string) {
  return (
    value
      .split(/\s+|[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CL"
  )
}

export function normalizeCustomer(customer: BackendCustomer): Customer {
  return {
    ...customer,
    initials: initials(customer.name),
  }
}

export function normalizeCustomerList(
  response: BackendCustomerListResponse,
): CustomerListResponse {
  return {
    ...response,
    data: response.data.map(normalizeCustomer),
  }
}
