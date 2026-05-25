import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Customer } from "@/lib/data-access/modules/customers"
import type { Lead } from "@/lib/data-access/modules/leads"

export type OperationalLifecycle = "Lead" | "MQL" | "SQL" | "Cliente"

export type IdentityLinkKind = "document" | "email" | "phone" | "name"

/** Chave estável para deduplicação operacional (read model). */
export type IdentityKey = {
  id: string
  kind: IdentityLinkKind
  raw: string
}

export type OperationalContact = {
  id: string
  identity: IdentityKey
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  document: string | null
  documentType: "cpf" | "cnpj" | null
  companies: string[]
  owner: string
  ownerInitials: string
  lifecycle: OperationalLifecycle
  lastInteractionAt: string | null
  nextFollowUpAt: string | null
  leadIds: string[]
  dealIds: string[]
  customerIds: string[]
  primaryLeadId: string | null
  primaryDealId: string | null
  leadCount: number
  dealCount: number
  openDealCount: number
  identityWarnings: string[]
}

export type OperationalCompany = {
  id: string
  name: string
  normalizedName: string
  domain: string
  owner: string
  ownerInitials: string
  contactIds: string[]
  contactCount: number
  dealIds: string[]
  dealCount: number
  openDealCount: number
  wonDealCount: number
  pipelineValue: number
  totalValue: number
  lastInteractionAt: string | null
  contacts: OperationalContact[]
  deals: CrmDeal[]
}

export type RelationshipIndex = {
  contacts: OperationalContact[]
  companies: OperationalCompany[]
  contactsById: Map<string, OperationalContact>
  companiesById: Map<string, OperationalCompany>
}

export type WorkspaceSearchResultKind =
  | "contact"
  | "company"
  | "deal"
  | "lead"
  | "customer"

export type WorkspaceSearchResult = {
  id: string
  kind: WorkspaceSearchResultKind
  title: string
  subtitle: string
  meta?: string
  href: string
  score: number
}

export type BuildRelationshipIndexInput = {
  deals: CrmDeal[]
  leads: Lead[]
  customers?: Customer[]
}
