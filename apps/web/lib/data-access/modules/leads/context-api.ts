import { apiClient } from "@/lib/data-access/api-client"

import { normalizeLead } from "./normalizers"
import type { BackendLeadContext, LeadContext } from "./context-types"

export async function fetchLeadContext(id: string): Promise<LeadContext> {
  const response = await apiClient.get<BackendLeadContext>(
    `/api/leads/${id}/context`,
  )

  return {
    ...response,
    lead: normalizeLead(response.lead),
  }
}
