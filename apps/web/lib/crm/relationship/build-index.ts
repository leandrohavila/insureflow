import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Customer } from "@/lib/data-access/modules/customers"
import type { Lead } from "@/lib/data-access/modules/leads"

import {
  companyIdFromName,
  contactIdFromIdentity,
  domainFromCompanyName,
  initialsFromName,
  normalizeCompanyName,
  normalizeEmail,
  normalizePhoneDigits,
  resolveIdentityKey,
} from "./identity"
import {
  lifecycleFromDeal,
  lifecycleFromLead,
  maxIsoDate,
  mergeLifecycle,
} from "./lifecycle"
import {
  emptyRelationshipIndex,
  normalizeIdentityValue,
  safeNumber,
  safeStringArray,
  warnRelationshipIndex,
} from "./safe"
import type {
  BuildRelationshipIndexInput,
  OperationalCompany,
  OperationalContact,
  RelationshipIndex,
} from "./types"

type MutableContact = OperationalContact & {
  _companies: Set<string>
}

function pickOwner(
  current: string,
  candidate: unknown,
): string {
  const next = normalizeIdentityValue(candidate).trim()
  if (!next || next === "Sem responsável") return current || "Sem responsável"
  if (!current || current === "Sem responsável") return next
  return current
}

function leadInteractionAt(lead: Lead): string | null {
  return lead.lastInteractionAt ?? lead.lastContactAt ?? lead.updatedAt ?? null
}

function dealInteractionAt(deal: CrmDeal): string | null {
  return (
    deal.commercialContext?.lastInteractionAt ??
    deal.convertedLead?.lastContactAt ??
    deal.updatedAt ??
    null
  )
}

function upsertContact(
  map: Map<string, MutableContact>,
  input: {
    name?: unknown
    email?: unknown
    phone?: unknown
    document?: unknown
    documentType?: "cpf" | "cnpj" | null
    company?: unknown
    owner?: unknown
    lifecycle: OperationalContact["lifecycle"]
    lastInteractionAt?: string | null
    leadId?: string
    dealId?: string
    customerId?: string
  },
): MutableContact | null {
  const name = normalizeIdentityValue(input.name).trim() || "Contato sem nome"

  const identity = resolveIdentityKey({
    name,
    email: input.email,
    phone: input.phone,
    document: input.document,
    company: input.company,
  })
  const id = contactIdFromIdentity(identity)
  const existing = map.get(id)

  const email = normalizeEmail(input.email)
  const phone = normalizePhoneDigits(input.phone)
  const owner = pickOwner(existing?.owner ?? "Sem responsável", input.owner)
  const document = normalizeIdentityValue(input.document).trim() || null
  const company = normalizeIdentityValue(input.company).trim() || null

  const contact: MutableContact = existing ?? {
    id,
    identity,
    name,
    email: null,
    phone: null,
    whatsapp: null,
    document,
    documentType: input.documentType ?? null,
    companies: [],
    owner,
    ownerInitials: initialsFromName(owner),
    lifecycle: input.lifecycle,
    lastInteractionAt: null,
    nextFollowUpAt: null,
    leadIds: [],
    dealIds: [],
    customerIds: [],
    primaryLeadId: null,
    primaryDealId: null,
    leadCount: 0,
    dealCount: 0,
    openDealCount: 0,
    identityWarnings: [],
    _companies: new Set<string>(),
  }

  if (name && name !== "Contato sem nome") contact.name = name
  if (email) contact.email = email
  if (phone) {
    contact.phone = phone
    contact.whatsapp = phone
  }
  if (document) contact.document = document
  if (input.documentType) contact.documentType = input.documentType
  if (company) contact._companies.add(company)

  contact.lifecycle = mergeLifecycle(contact.lifecycle, input.lifecycle)
  contact.lastInteractionAt = maxIsoDate(
    contact.lastInteractionAt,
    input.lastInteractionAt,
  )
  contact.owner = owner
  contact.ownerInitials = initialsFromName(owner)

  if (input.leadId && !contact.leadIds.includes(input.leadId)) {
    contact.leadIds.push(input.leadId)
    contact.primaryLeadId ??= input.leadId
  }
  if (input.dealId && !contact.dealIds.includes(input.dealId)) {
    contact.dealIds.push(input.dealId)
    contact.primaryDealId ??= input.dealId
  }
  if (input.customerId && !contact.customerIds.includes(input.customerId)) {
    contact.customerIds.push(input.customerId)
  }

  map.set(id, contact)
  return contact
}

function finalizeContact(contact: MutableContact): OperationalContact {
  const leadCount = contact.leadIds.length
  const dealCount = contact.dealIds.length
  const warnings: string[] = []

  if (leadCount > 1) {
    warnings.push(`${leadCount} leads vinculados à mesma identidade`)
  }
  if (dealCount > 1) {
    warnings.push(`${dealCount} negócios vinculados à mesma identidade`)
  }
  if (contact.customerIds.length > 0) {
    warnings.push("Cliente cadastrado com documento correspondente")
  }

  const { _companies, ...rest } = contact

  return {
    ...rest,
    companies: Array.from(_companies).sort((a, b) => a.localeCompare(b)),
    leadCount,
    dealCount,
    identityWarnings: warnings,
  }
}

function ingestLead(map: Map<string, MutableContact>, lead: Lead) {
  if (!lead?.id) return

  upsertContact(map, {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    document: lead.document,
    documentType: lead.documentType ?? null,
    company: lead.company,
    owner: lead.assignedTo,
    lifecycle: lifecycleFromLead(lead),
    lastInteractionAt: leadInteractionAt(lead),
    leadId: lead.id,
    dealId: lead.dealId ?? undefined,
  })
}

function ingestDeal(map: Map<string, MutableContact>, deal: CrmDeal) {
  if (!deal?.id) return

  const lead = deal.convertedLead
  if (lead?.id) {
    upsertContact(map, {
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? deal.commercialContext?.phone,
      company: deal.company,
      owner: deal.assignedTo ?? lead.assignedTo,
      lifecycle: lifecycleFromDeal(deal),
      lastInteractionAt:
        dealInteractionAt(deal) ?? lead.lastContactAt ?? deal.updatedAt ?? null,
      leadId: lead.id,
      dealId: deal.id,
    })
    return
  }

  upsertContact(map, {
    name: deal.title,
    email: null,
    phone: deal.commercialContext?.phone,
    company: deal.company,
    owner: deal.assignedTo,
    lifecycle: lifecycleFromDeal(deal),
    lastInteractionAt: dealInteractionAt(deal),
    dealId: deal.id,
  })
}

function ingestCustomer(map: Map<string, MutableContact>, customer: Customer) {
  if (!customer?.id) return

  upsertContact(map, {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    document: customer.document,
    documentType: customer.type === "PJ" ? "cnpj" : "cpf",
    company: customer.type === "PJ" ? customer.name : null,
    owner: "Sem responsável",
    lifecycle: "Cliente",
    lastInteractionAt: customer.updatedAt ?? null,
    customerId: customer.id,
  })
}

type CompanyBucket = {
  displayName: string
  deals: CrmDeal[]
}

function pickDisplayName(current: string, candidate: string): string {
  const trimmed = normalizeIdentityValue(candidate).trim()
  if (!trimmed) return current
  if (!current) return trimmed
  if (trimmed.length > current.length) return trimmed
  if (trimmed.length < current.length) return current
  return trimmed.localeCompare(current, "pt-BR") < 0 ? trimmed : current
}

function buildCompanies(
  deals: CrmDeal[],
  contacts: OperationalContact[],
): OperationalCompany[] {
  const dealsByCompany = new Map<string, CompanyBucket>()

  const upsertBucket = (rawName: string, deal?: CrmDeal) => {
    const trimmed = normalizeIdentityValue(rawName).trim()
    if (!trimmed) return

    const bucketKey = normalizeCompanyName(trimmed)
    const existing = dealsByCompany.get(bucketKey)
    if (!existing) {
      dealsByCompany.set(bucketKey, {
        displayName: trimmed,
        deals: deal ? [deal] : [],
      })
      return
    }

    existing.displayName = pickDisplayName(existing.displayName, trimmed)
    if (deal) existing.deals.push(deal)
  }

  for (const deal of deals) {
    const name = normalizeIdentityValue(deal?.company).trim()
    if (!name) continue
    upsertBucket(name, deal)
  }

  for (const contact of contacts) {
    for (const companyName of safeStringArray(contact.companies)) {
      upsertBucket(companyName)
    }
  }

  return Array.from(dealsByCompany.values())
    .map(({ displayName: name, deals: companyDeals }) => {
      const normalizedName = normalizeCompanyName(name)
      const id = companyIdFromName(name)
      const linkedContacts = contacts.filter((contact) =>
        safeStringArray(contact.companies).some(
          (company) => normalizeCompanyName(company) === normalizedName,
        ),
      )
      const contactIds = linkedContacts.map((contact) => contact.id)
      const dealIds = companyDeals.map((deal) => deal.id).filter(Boolean)
      const openDealCount = companyDeals.filter(
        (deal) => deal.status === "open",
      ).length
      const wonDealCount = companyDeals.filter(
        (deal) => deal.status === "won",
      ).length
      const pipelineValue = companyDeals
        .filter((deal) => deal.status === "open")
        .reduce((sum, deal) => sum + safeNumber(deal.value), 0)
      const totalValue = companyDeals.reduce(
        (sum, deal) => sum + safeNumber(deal.value),
        0,
      )
      const owner = pickOwner(
        "Sem responsável",
        companyDeals[0]?.owner ??
          companyDeals[0]?.assignedTo ??
          linkedContacts[0]?.owner,
      )
      const lastInteractionAt = companyDeals.reduce<string | null>(
        (current, deal) => maxIsoDate(current, dealInteractionAt(deal)),
        linkedContacts.reduce<string | null>(
          (current, contact) =>
            maxIsoDate(current, contact.lastInteractionAt),
          null,
        ),
      )

      return {
        id,
        name,
        normalizedName,
        domain: domainFromCompanyName(name),
        owner,
        ownerInitials: initialsFromName(owner),
        contactIds,
        contactCount: contactIds.length,
        dealIds,
        dealCount: dealIds.length,
        openDealCount,
        wonDealCount,
        pipelineValue,
        totalValue,
        lastInteractionAt,
        contacts: linkedContacts,
        deals: companyDeals,
      } satisfies OperationalCompany
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
}

function safeIngest<T>(
  label: string,
  record: T,
  ingest: (record: T) => void,
) {
  try {
    ingest(record)
  } catch (error) {
    warnRelationshipIndex(`${label} ingest skipped`, { record, error })
  }
}

export function buildRelationshipIndex({
  deals,
  leads,
  customers = [],
}: BuildRelationshipIndexInput): RelationshipIndex {
  const contactMap = new Map<string, MutableContact>()
  const safeDeals = Array.isArray(deals) ? deals : []
  const safeLeads = Array.isArray(leads) ? leads : []
  const safeCustomers = Array.isArray(customers) ? customers : []

  for (const lead of safeLeads) {
    safeIngest("lead", lead, (item) => ingestLead(contactMap, item))
  }
  for (const deal of safeDeals) {
    safeIngest("deal", deal, (item) => ingestDeal(contactMap, item))
  }
  for (const customer of safeCustomers) {
    safeIngest("customer", customer, (item) => ingestCustomer(contactMap, item))
  }

  const contacts = Array.from(contactMap.values())
    .map(finalizeContact)
    .map((contact) => {
      const openDealCount = safeDeals.filter(
        (deal) =>
          deal?.id &&
          contact.dealIds.includes(deal.id) &&
          deal.status === "open",
      ).length
      return { ...contact, openDealCount }
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))

  const companies = buildCompanies(safeDeals, contacts)

  return {
    contacts,
    companies,
    contactsById: new Map(contacts.map((contact) => [contact.id, contact])),
    companiesById: new Map(companies.map((company) => [company.id, company])),
  }
}

export function safeBuildRelationshipIndex(
  input: BuildRelationshipIndexInput,
): { index: RelationshipIndex; failed: boolean } {
  try {
    return { index: buildRelationshipIndex(input), failed: false }
  } catch (error) {
    warnRelationshipIndex("build failed", error)
    return { index: emptyRelationshipIndex(), failed: true }
  }
}

export function findContactById(
  index: RelationshipIndex | null | undefined,
  id: string | null | undefined,
): OperationalContact | null {
  if (!index || !id) return null
  return index.contactsById.get(id) ?? null
}

export function findCompanyById(
  index: RelationshipIndex | null | undefined,
  id: string | null | undefined,
): OperationalCompany | null {
  if (!index || !id) return null
  return index.companiesById.get(id) ?? null
}
