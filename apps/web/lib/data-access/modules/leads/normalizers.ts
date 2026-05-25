import { normalizeDeal } from "@/lib/data-access/modules/crm/normalizers"

import type {
  BackendConvertLeadResponse,
  BackendLead,
  BackendLeadListResponse,
  ConvertLeadResponse,
  Lead,
  LeadListResponse,
} from "./types"

function normalizeText(value: string | null | undefined) {
  return value?.trim() || undefined
}

function initials(value: string | null | undefined) {
  const normalized = normalizeText(value)
  if (!normalized) return "LD"

  return (
    normalized
      .split(/\s+|[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "LD"
  )
}

export function normalizeLead(lead: BackendLead): Lead {
  const name =
    normalizeText(lead.name) ??
    normalizeText(lead.company) ??
    normalizeText(lead.email) ??
    "Lead sem nome"

  return {
    id: lead.id ?? "",
    tenantId: lead.tenantId ?? "",
    name,
    email: normalizeText(lead.email) ?? null,
    phone: normalizeText(lead.phone) ?? null,
    company: normalizeText(lead.company) ?? null,
    source: normalizeText(lead.source) ?? null,
    status: lead.status ?? "new",
    notes: normalizeText(lead.notes) ?? null,
    assignedTo: normalizeText(lead.assignedTo) ?? null,
    documentType: lead.documentType ?? null,
    document: lead.document ?? null,
    lastContactAt: lead.lastContactAt ?? null,
    lastInteractionAt: lead.lastInteractionAt ?? lead.lastContactAt ?? null,
    dealId: lead.dealId ?? null,
    createdAt: lead.createdAt ?? "",
    updatedAt: lead.updatedAt ?? "",
    initials: initials(name),
  }
}

export function normalizeLeadList(
  response: BackendLeadListResponse,
): LeadListResponse {
  const data = Array.isArray(response.data) ? response.data : []
  const meta = response.meta ?? {}

  return {
    data: data.map((item) => normalizeLead(item ?? ({} as BackendLead))),
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? (data.length || 10),
      total: meta.total ?? data.length,
      totalPages: meta.totalPages ?? 1,
      ...(meta.counts
        ? {
            counts: {
              converted: meta.counts.converted ?? 0,
              qualified: meta.counts.qualified ?? 0,
            },
          }
        : {}),
    },
  }
}

export function normalizeConvertLeadResponse(
  response: BackendConvertLeadResponse,
): ConvertLeadResponse {
  return {
    lead: normalizeLead(response.lead),
    deal: normalizeDeal(response.deal),
  }
}
