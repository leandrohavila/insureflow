import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Customer } from "@/lib/data-access/modules/customers"
import type { Lead } from "@/lib/data-access/modules/leads"

import { matchesSearchTerm, normalizePhoneDigits } from "./identity"
import { normalizeIdentityValue, safeStringArray } from "./safe"
import type {
  OperationalCompany,
  OperationalContact,
  RelationshipIndex,
  WorkspaceSearchResult,
  WorkspaceSearchResultKind,
} from "./types"

function searchValues(values: unknown[]): string[] {
  return values.map((value) => normalizeIdentityValue(value)).filter(Boolean)
}

function scoreMatch(term: unknown, values: unknown[], weight: number): number {
  const normalized = normalizeIdentityValue(term).trim().toLowerCase()
  if (!normalized) return 0

  let score = 0
  for (const value of searchValues(values)) {
    const lower = value.toLowerCase()
    if (lower === normalized) score += 100 * weight
    else if (lower.startsWith(normalized)) score += 60 * weight
    else if (lower.includes(normalized)) score += 30 * weight

    const termDigits = normalized.replace(/\D/g, "")
    const valueDigits = value.replace(/\D/g, "")
    if (termDigits.length >= 3 && valueDigits.includes(termDigits)) {
      score += 50 * weight
    }
  }
  return score
}

function buildHref(kind: WorkspaceSearchResultKind, id: string): string {
  switch (kind) {
    case "contact":
      return `/crm/contatos?contact=${encodeURIComponent(id)}&sheet=v2`
    case "company":
      return `/crm/empresas?company=${encodeURIComponent(id)}&sheet=v2`
    case "deal":
      return `/crm/negocios?deal=${encodeURIComponent(id)}&sheet=v2`
    case "lead":
      return `/leads?lead=${encodeURIComponent(id)}&sheet=v2`
    case "customer":
      return `/crm/clientes?customer=${encodeURIComponent(id)}&sheet=v2`
  }
}

export function searchRelationshipIndex(
  index: RelationshipIndex | null | undefined,
  term: unknown,
  limit = 20,
): WorkspaceSearchResult[] {
  if (!index) return []

  const normalized = normalizeIdentityValue(term).trim()
  if (!normalized) return []

  const results: WorkspaceSearchResult[] = []

  for (const contact of index.contacts ?? []) {
    const values = searchValues([
      contact.name,
      contact.email,
      contact.phone,
      contact.whatsapp,
      contact.document,
      ...safeStringArray(contact.companies),
    ])
    if (!matchesSearchTerm(normalized, values)) continue

    const score = scoreMatch(normalized, values, 1)
    results.push({
      id: contact.id,
      kind: "contact",
      title: contact.name || "Contato sem nome",
      subtitle: safeStringArray(contact.companies)[0] ?? "Contato operacional",
      meta: contact.phone
        ? normalizePhoneDigits(contact.phone) ?? undefined
        : contact.email ?? undefined,
      href: buildHref("contact", contact.id),
      score,
    })
  }

  for (const company of index.companies ?? []) {
    const values = searchValues([company.name, company.domain, company.owner])
    if (!matchesSearchTerm(normalized, values)) continue

    results.push({
      id: company.id,
      kind: "company",
      title: company.name || "Empresa sem nome",
      subtitle: `${company.dealCount} negócio(s) · ${company.contactCount} contato(s)`,
      meta: company.domain,
      href: buildHref("company", company.id),
      score: scoreMatch(normalized, values, 0.9),
    })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function searchOperationalWorkspace(input: {
  index: RelationshipIndex | null | undefined
  deals: CrmDeal[]
  leads: Lead[]
  customers: Customer[]
  term: unknown
  limit?: number
}): WorkspaceSearchResult[] {
  const {
    index,
    deals = [],
    leads = [],
    customers = [],
    term,
    limit = 24,
  } = input
  const normalized = normalizeIdentityValue(term).trim()
  if (!normalized) return []

  const results = searchRelationshipIndex(index, normalized, limit)

  for (const deal of deals) {
    if (!deal?.id) continue

    const values = searchValues([
      deal.title,
      deal.company,
      deal.contact,
      deal.convertedLead?.name,
      deal.convertedLead?.email,
      deal.convertedLead?.phone,
      deal.commercialContext?.phone,
    ])
    if (!matchesSearchTerm(normalized, values)) continue

    results.push({
      id: deal.id,
      kind: "deal",
      title: normalizeIdentityValue(deal.title) || "Negócio sem título",
      subtitle: normalizeIdentityValue(deal.company) || "Sem empresa",
      meta: deal.stage,
      href: buildHref("deal", deal.id),
      score: scoreMatch(normalized, values, 0.85),
    })
  }

  for (const lead of leads) {
    if (!lead?.id) continue

    const values = searchValues([
      lead.name,
      lead.email,
      lead.phone,
      lead.company,
      lead.document,
    ])
    if (!matchesSearchTerm(normalized, values)) continue

    results.push({
      id: lead.id,
      kind: "lead",
      title: normalizeIdentityValue(lead.name) || "Lead sem nome",
      subtitle: normalizeIdentityValue(lead.company) || "Lead",
      meta: lead.status,
      href: buildHref("lead", lead.id),
      score: scoreMatch(normalized, values, 0.8),
    })
  }

  for (const customer of customers) {
    if (!customer?.id) continue

    const values = searchValues([
      customer.name,
      customer.email,
      customer.phone,
      customer.document,
    ])
    if (!matchesSearchTerm(normalized, values)) continue

    results.push({
      id: customer.id,
      kind: "customer",
      title: normalizeIdentityValue(customer.name) || "Cliente sem nome",
      subtitle: customer.type === "PJ" ? "Pessoa jurídica" : "Pessoa física",
      meta: customer.document,
      href: buildHref("customer", customer.id),
      score: scoreMatch(normalized, values, 0.75),
    })
  }

  const deduped = new Map<string, WorkspaceSearchResult>()
  for (const result of results) {
    const key = `${result.kind}:${result.id}`
    const existing = deduped.get(key)
    if (!existing || result.score > existing.score) {
      deduped.set(key, result)
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function filterContacts(
  index: RelationshipIndex | null | undefined,
  term: unknown,
): OperationalContact[] {
  if (!index) return []

  const normalized = normalizeIdentityValue(term).trim()
  if (!normalized) return index.contacts ?? []

  return (index.contacts ?? []).filter((contact) =>
    matchesSearchTerm(normalized, [
      contact.name,
      contact.email,
      contact.phone,
      contact.whatsapp,
      contact.document,
      ...safeStringArray(contact.companies),
      contact.owner,
      ...safeStringArray(contact.leadIds),
      ...safeStringArray(contact.dealIds),
    ]),
  )
}

export function filterCompanies(
  index: RelationshipIndex | null | undefined,
  term: unknown,
): OperationalCompany[] {
  if (!index) return []

  const normalized = normalizeIdentityValue(term).trim()
  if (!normalized) return index.companies ?? []

  return (index.companies ?? []).filter((company) =>
    matchesSearchTerm(normalized, [
      company.name,
      company.domain,
      company.owner,
      ...(company.deals ?? []).map((deal) => deal?.title),
    ]),
  )
}
