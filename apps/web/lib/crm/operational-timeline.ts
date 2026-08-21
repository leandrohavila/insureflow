import type { Activity } from "@/lib/data-access/modules/activities"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Customer } from "@/lib/data-access/modules/customers"

import {
  ACTIVITY_EVENT_LABELS,
  activityEventLabel,
  type ActivityEventKind,
} from "./activity-event-kinds"

export {
  ACTIVITY_EVENT_KINDS as OPERATIONAL_EVENT_KINDS,
  ACTIVITY_EVENT_LABELS as OPERATIONAL_EVENT_LABELS,
  activityEventLabel as operationalEventLabel,
  isActivityEventKind as isOperationalEventKind,
  type ActivityEventKind as OperationalEventKind,
} from "./activity-event-kinds"

export type OperationalTimelineItem = {
  id: string
  kind: ActivityEventKind | Activity["type"]
  label: string
  subject: string
  description: string | null
  occurredAt: string
  source: "activity" | "synthetic"
  activityId?: string
  dealId?: string | null
  customerId?: string | null
  leadId?: string | null
  policyId?: string | null
}

function syntheticEvent(input: {
  id: string
  kind: ActivityEventKind
  subject: string
  description?: string | null
  occurredAt: string
  dealId?: string | null
  customerId?: string | null
}): OperationalTimelineItem {
  return {
    id: input.id,
    kind: input.kind,
    label: ACTIVITY_EVENT_LABELS[input.kind],
    subject: input.subject,
    description: input.description ?? null,
    occurredAt: input.occurredAt,
    source: "synthetic",
    dealId: input.dealId,
    customerId: input.customerId,
  }
}

export function buildOperationalTimeline(input: {
  customer: Customer | null
  deals?: CrmDeal[]
  activities?: Activity[]
}): OperationalTimelineItem[] {
  const items: OperationalTimelineItem[] = []
  const { customer, deals = [], activities = [] } = input

  const hasDealWonActivity = activities.some(
    (activity) => activity.operationalEventKind === "deal_won",
  )

  if (customer?.sourceDealId && !hasDealWonActivity) {
    const sourceDeal = deals.find((deal) => deal.id === customer.sourceDealId)
    items.push(
      syntheticEvent({
        id: `synthetic:deal-won:${customer.sourceDealId}`,
        kind: "deal_won",
        subject: sourceDeal
          ? `Negócio ganho — ${sourceDeal.title}`
          : "Negócio ganho",
        description: "Início do relacionamento operacional pós-venda.",
        occurredAt:
          sourceDeal?.wonAt ?? sourceDeal?.updatedAt ?? customer.createdAt,
        dealId: customer.sourceDealId,
        customerId: customer.id,
      }),
    )
  }

  for (const activity of activities) {
    const operationalKind = activity.operationalEventKind as
      | ActivityEventKind
      | null
      | undefined

    items.push({
      id: activity.id,
      kind: operationalKind ?? activity.type,
      label: operationalKind
        ? activityEventLabel(operationalKind)
        : activity.type,
      subject: activity.subject,
      description: activity.description,
      occurredAt: activity.occurredAt,
      source: "activity",
      activityId: activity.id,
      dealId: activity.dealId,
      customerId: activity.customerId,
      leadId: activity.leadId,
      policyId: activity.policyId ?? null,
    })
  }

  return items.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}
