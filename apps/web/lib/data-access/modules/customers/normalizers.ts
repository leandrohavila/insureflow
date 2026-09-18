import type {
  BackendCustomer,
  BackendCustomerListResponse,
  Customer,
  CustomerLifecycleStage,
  CustomerListResponse,
} from "./types"
import { normalizeCustomerLifecycleStage } from "@/lib/crm/customer-lifecycle"
import { normalizeRenewalStatus } from "@/lib/crm/customer-renewal"

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

function normalizeLifecycleStage(
  value: string | null | undefined,
): CustomerLifecycleStage {
  return normalizeCustomerLifecycleStage(value)
}

export function normalizeCustomer(customer: BackendCustomer): Customer {
  const name = customer.name?.trim() || "Cliente sem nome"

  return {
    ...customer,
    name,
    lifecycleStage: normalizeLifecycleStage(customer.lifecycleStage),
    sourceDealId: customer.sourceDealId ?? null,
    companyName: customer.companyName ?? null,
    renewalDate: customer.renewalDate ?? null,
    renewalStatus: normalizeRenewalStatus(customer.renewalStatus),
    renewalPipeline: customer.renewalPipeline ?? null,
    initials: initials(name),
  }
}

export function normalizeCustomerList(
  response: BackendCustomerListResponse,
): CustomerListResponse {
  const meta = response.meta

  return {
    data: response.data.map(normalizeCustomer),
    meta: {
      ...meta,
      ...(meta.counts
        ? {
            counts: {
              pj: meta.counts.pj ?? 0,
              withEmail: meta.counts.withEmail ?? 0,
            },
          }
        : {}),
    },
  }
}
