import { apiClient } from "@/lib/data-access/api-client"

export type PolicyLinkRecord = {
  id: string
  policyNumber: string
  insurer?: string | null
  customer?: {
    id: string
    name: string
    document?: string | null
  } | null
}

export async function fetchPoliciesForLink(limit = 100) {
  return apiClient.get<{ data: PolicyLinkRecord[] }>(
    `/api/policies?limit=${limit}`,
  )
}
