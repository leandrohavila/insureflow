import type { Activity } from "@/lib/data-access/modules/activities"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Customer } from "@/lib/data-access/modules/customers"

export const OPERATIONAL_EVENT_KINDS = [
  "deal_won",
  "policy_issued",
  "policy_issuance",
  "policy_upload",
  "renewal",
  "renewal_started",
  "renewal_completed",
  "claim",
  "follow_up",
  "billing",
  "cancellation",
  "lifecycle_change",
] as const

export type OperationalEventKind = (typeof OPERATIONAL_EVENT_KINDS)[number]

export const OPERATIONAL_EVENT_LABELS: Record<OperationalEventKind, string> = {
  deal_won: "Negócio ganho",
  policy_issued: "Apólice emitida",
  policy_issuance: "Emissão de apólice",
  policy_upload: "Upload de apólice",
  renewal: "Renovação",
  renewal_started: "Renovação iniciada",
  renewal_completed: "Renovação concluída",
  claim: "Sinistro",
  follow_up: "Follow-up operacional",
  billing: "Cobrança",
  cancellation: "Cancelamento",
  lifecycle_change: "Mudança de lifecycle",
}

export function operationalEventLabel(
  kind: string | null | undefined,
): string {
  if (!kind) return "Evento operacional"
  if (isOperationalEventKind(kind)) return OPERATIONAL_EVENT_LABELS[kind]
  return kind.replace(/_/g, " ")
}

export type OperationalTimelineItem = {
  id: string
  kind: OperationalEventKind | Activity["type"]
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
  kind: OperationalEventKind
  subject: string
  description?: string | null
  occurredAt: string
  dealId?: string | null
  customerId?: string | null
}): OperationalTimelineItem {
  return {
    id: input.id,
    kind: input.kind,
    label: OPERATIONAL_EVENT_LABELS[input.kind],
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

  if (customer?.sourceDealId) {
    const sourceDeal = deals.find((deal) => deal.id === customer.sourceDealId)
    items.push(
      syntheticEvent({
        id: `synthetic:deal-won:${customer.sourceDealId}`,
        kind: "deal_won",
        subject: sourceDeal
          ? `Negócio ganho — ${sourceDeal.title}`
          : "Negócio ganho",
        description: "Início do relacionamento operacional pós-venda.",
        occurredAt: sourceDeal?.wonAt ?? sourceDeal?.updatedAt ?? customer.createdAt,
        dealId: customer.sourceDealId,
        customerId: customer.id,
      }),
    )
  }

  for (const activity of activities) {
    const operationalKind = activity.operationalEventKind as
      | OperationalEventKind
      | null
      | undefined

    items.push({
      id: activity.id,
      kind: operationalKind ?? activity.type,
      label: operationalKind
        ? operationalEventLabel(operationalKind)
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

export function isOperationalEventKind(
  value: string | null | undefined,
): value is OperationalEventKind {
  return (
    typeof value === "string" &&
    (OPERATIONAL_EVENT_KINDS as readonly string[]).includes(value)
  )
}
