import type {
  Activity,
  ActivityListMeta,
  ActivityType,
  BackendActivity,
  BackendActivityListResponse,
} from "./types"
import { ACTIVITY_TYPES } from "./types"

function normalizeActivityType(value: unknown): ActivityType {
  if (
    typeof value === "string" &&
    (ACTIVITY_TYPES as readonly string[]).includes(value)
  ) {
    return value as ActivityType
  }
  return "note"
}

function normalizePerformer(
  activity: BackendActivity,
): Activity["performedBy"] {
  return {
    id: activity.performedBy?.id ?? activity.performedById,
    name: activity.performedBy?.name?.trim() || "Usuário",
    initials: activity.performedBy?.initials?.trim() || "IF",
  }
}

export function normalizeActivity(activity: BackendActivity): Activity {
  return {
    id: activity.id,
    tenantId: activity.tenantId,
    type: normalizeActivityType(activity.type),
    status: (activity.status as Activity["status"]) ?? "pending",
    subject: activity.subject?.trim() || "Atividade",
    description: activity.description ?? null,
    outcome: activity.outcome ?? null,
    occurredAt: activity.occurredAt,
    nextFollowUpAt: activity.nextFollowUpAt ?? null,
    leadId: activity.leadId ?? null,
    dealId: activity.dealId ?? null,
    customerId: activity.customerId ?? null,
    policyId: activity.policyId ?? null,
    performedById: activity.performedById,
    performedBy: normalizePerformer(activity),
    operationalEventKind: activity.operationalEventKind ?? null,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  }
}

export function normalizeActivityList(response: BackendActivityListResponse): {
  data: Activity[]
  meta: ActivityListMeta
} {
  const data = (response.data ?? []).map(normalizeActivity)
  const meta = response.meta ?? {}

  return {
    data,
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? (data.length || 20),
      total: meta.total ?? data.length,
      totalPages: meta.totalPages ?? 1,
    },
  }
}
