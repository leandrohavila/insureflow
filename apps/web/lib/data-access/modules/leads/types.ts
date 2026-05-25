import type { LeadDocumentType } from "@/lib/documents/document"
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
  documentType?: LeadDocumentType | null
  document?: string | null
  status: LeadStatus
  notes?: string | null
  assignedTo?: string | null
  lastContactAt?: string | null
  lastInteractionAt?: string | null
  dealId?: string | null
  createdAt: string
  updatedAt: string
  initials: string
}

export type LeadDuplicate = {
  id: string
  name: string
  status: LeadStatus
  assignedTo?: string | null
  lastContactAt?: string | null
  createdAt: string
  documentType?: LeadDocumentType | null
  document?: string | null
}

export type LeadListFilters = {
  search?: string
  status?: LeadStatus | "all"
  source?: string
  mine?: boolean
  page?: number
  limit?: number
}

export type LeadListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  counts?: {
    converted: number
    qualified: number
  }
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
  documentType?: LeadDocumentType
  document?: string
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

export type BackendLead = Omit<
  Lead,
  "initials" | "name" | "status" | "createdAt" | "updatedAt"
> & {
  name?: string | null
  status?: LeadStatus | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type BackendLeadListResponse = {
  data?: BackendLead[] | null
  meta?: Partial<LeadListMeta> | null
}

export type LeadDuplicatesResponse = {
  data?: LeadDuplicate[] | null
}

export type BackendConvertLeadResponse = {
  lead: BackendLead
  deal: CrmDeal
}
