import type {
  FollowUpStatus,
  FollowUpType,
} from "@/lib/business-units/constants"

export type LeadFollowUp = {
  id: string
  tenantId: string
  leadId: string
  scheduledAt: string
  type: FollowUpType
  status: FollowUpStatus
  notes?: string | null
  createdById: string
  assignedUserId?: string | null
  businessUnitId?: string | null
  lead?: { id: string; name: string; status: string }
  assignedUser?: { id: string; name: string } | null
}

export type LeadFollowUpMetrics = {
  pending: number
  overdue: number
  completed: number
}

export type LeadFollowUpWindow = "today" | "overdue" | "next7"

export type CreateLeadFollowUpInput = {
  leadId: string
  scheduledAt: string
  type: FollowUpType
  notes?: string
  assignedUserId?: string
}

export type UpdateLeadFollowUpInput = Partial<CreateLeadFollowUpInput> & {
  status?: FollowUpStatus
}
