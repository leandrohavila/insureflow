export const ACTIVITY_TYPES = [
  "call",
  "whatsapp",
  "email",
  "meeting",
  "visit",
  "note",
  "follow_up",
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const ACTIVITY_STATUSES = ["pending", "completed", "cancelled"] as const
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number]

export type ActivityPerformer = {
  id: string
  name: string
  initials: string
}

export type Activity = {
  id: string
  tenantId: string
  type: ActivityType
  status: ActivityStatus
  subject: string
  description: string | null
  outcome: string | null
  occurredAt: string
  nextFollowUpAt: string | null
  leadId: string | null
  dealId: string | null
  customerId: string | null
  policyId?: string | null
  performedById: string
  performedBy: ActivityPerformer
  operationalEventKind?: string | null
  createdAt: string
  updatedAt: string
}

export type ActivityListFilters = {
  status?: ActivityStatus
  leadId?: string
  dealId?: string
  customerId?: string
  type?: ActivityType
  occurredAtFrom?: string
  occurredAtTo?: string
  nextFollowUpFrom?: string
  nextFollowUpTo?: string
  page?: number
  limit?: number
}

export type ActivityListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ActivityListResponse = {
  data: Activity[]
  meta: ActivityListMeta
}

export type CreateActivityInput = {
  type: ActivityType
  status?: ActivityStatus
  subject: string
  description?: string
  outcome?: string
  occurredAt: string
  nextFollowUpAt?: string
  leadId?: string
  dealId?: string
  customerId?: string
  policyId?: string
}

/** Vínculos atuais da atividade — incluir em PATCH que não alteram FK (ex.: concluir). */
export function pickActivityRelationFields(
  activity: Activity,
): Partial<
  Pick<CreateActivityInput, "leadId" | "dealId" | "customerId" | "policyId">
> {
  return {
    ...(activity.leadId ? { leadId: activity.leadId } : {}),
    ...(activity.dealId ? { dealId: activity.dealId } : {}),
    ...(activity.customerId ? { customerId: activity.customerId } : {}),
    ...(activity.policyId ? { policyId: activity.policyId } : {}),
  }
}

export type UpdateActivityInput = Partial<Omit<CreateActivityInput, "nextFollowUpAt">> & {
  /** Pass null to clear the scheduled follow-up date. */
  nextFollowUpAt?: string | null
  /** Pass to change the operational status. */
  status?: ActivityStatus
}

export type BackendActivity = Omit<Activity, "performedBy" | "status"> & {
  status?: string | null
  performedBy?: ActivityPerformer | null
}

export type BackendActivityListResponse = {
  data?: BackendActivity[] | null
  meta?: Partial<ActivityListMeta> | null
}
