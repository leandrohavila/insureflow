import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export type Lead = {
  id: string
  tenantId: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  source?: string | null
  status: LeadStatus
  notes?: string | null
  assignedTo?: string | null
  dealId?: string | null
  createdAt: string
  updatedAt: string
  initials: string
}

export type LeadListFilters = {
  search?: string
  status?: LeadStatus | "all"
  source?: string
  page?: number
  limit?: number
}

export type LeadListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type LeadListResponse = {
  data: Lead[]
  meta: LeadListMeta
}

export type CreateLeadInput = {
  name: string
  email?: string
  phone?: string
  company?: string
  source?: string
  status: LeadStatus
  notes?: string
  assignedTo?: string
}

export type UpdateLeadInput = Partial<CreateLeadInput>

export type ConvertLeadInput = {
  title?: string
  value?: number
  stage?: CrmStageId
  assignedTo?: string
}

export type ConvertLeadResponse = {
  lead: Lead
  deal: CrmDeal
}

export type BackendLead = Omit<Lead, "initials">

export type BackendLeadListResponse = {
  data: BackendLead[]
  meta: LeadListMeta
}

export type BackendConvertLeadResponse = {
  lead: BackendLead
  deal: CrmDeal
}
