import type {
  BackendConvertLeadResponse,
  BackendLead,
  BackendLeadListResponse,
  ConvertLeadResponse,
  Lead,
  LeadListResponse,
} from "./types"

function initials(value: string) {
  return (
    value
      .split(/\s+|[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "LD"
  )
}

export function normalizeLead(lead: BackendLead): Lead {
  return {
    ...lead,
    initials: initials(lead.name),
  }
}

export function normalizeLeadList(
  response: BackendLeadListResponse,
): LeadListResponse {
  return {
    ...response,
    data: response.data.map(normalizeLead),
  }
}

export function normalizeConvertLeadResponse(
  response: BackendConvertLeadResponse,
): ConvertLeadResponse {
  return {
    ...response,
    lead: normalizeLead(response.lead),
  }
}
