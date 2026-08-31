import type { LeadDocumentType } from "@/lib/documents/document"
import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import type { InterestCategory } from "@/lib/business-units/constants"
import type { BusinessUnitSummary } from "@/lib/data-access/modules/business-units"

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export type LeadOwner = {
  id: string
  name: string
  initials: string
}

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
  ownerUserId?: string | null
  ownerTeamId?: string | null
  owner?: LeadOwner | null
  lastContactAt?: string | null
  lastInteractionAt?: string | null
  businessUnitId?: string | null
  businessUnit?: BusinessUnitSummary | null
  businessUnits?: BusinessUnitSummary[]
  interestCategories?: InterestCategory[]
  lostReason?: string | null
  lossReasonId?: string | null
  lostAt?: string | null
  reactivationEnabled?: boolean
  reactivationDays?: number | null
  reactivationAttempts?: number
  nextReactivationAt?: string | null
  lastReactivatedAt?: string | null
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
  businessUnitId?: string
  interestCategory?: InterestCategory | "all"
  page?: number
  limit?: number
}

export type LeadListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  counts?: {
    new: number
    contacted: number
    qualified: number
    converted: number
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
  status?: LeadStatus
  notes?: string
  assignedTo?: string
  businessUnitId?: string
  businessUnitIds?: string[]
  interestCategories?: InterestCategory[]
  lostReason?: string
  lossReasonId?: string
  followUpDays?: number
  followUpType?: "CALL" | "WHATSAPP" | "EMAIL" | "MEETING"
}

export type CreateLeadRequestInput = CreateLeadInput & {
  idempotencyKey?: string
  perfSubmitStartedAt?: number
  perfTraceId?: string
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
  owner?: LeadOwner | null
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
