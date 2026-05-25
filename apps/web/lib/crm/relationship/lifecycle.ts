import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Lead } from "@/lib/data-access/modules/leads"

import type { OperationalLifecycle } from "./types"

export function lifecycleFromDeal(deal: CrmDeal): OperationalLifecycle {
  if (deal.status === "won" || deal.stage === "fechado") return "Cliente"
  if (deal.stage === "proposta" || deal.stage === "negociacao") return "SQL"
  if (deal.stage === "qualificacao") return "MQL"
  return "Lead"
}

export function lifecycleFromLead(lead: Lead): OperationalLifecycle {
  if (lead.status === "converted") return "SQL"
  if (lead.status === "qualified") return "MQL"
  if (lead.status === "lost") return "Lead"
  return "Lead"
}

const LIFECYCLE_RANK: Record<OperationalLifecycle, number> = {
  Lead: 0,
  MQL: 1,
  SQL: 2,
  Cliente: 3,
}

export function mergeLifecycle(
  current: OperationalLifecycle,
  next: OperationalLifecycle,
): OperationalLifecycle {
  return LIFECYCLE_RANK[next] > LIFECYCLE_RANK[current] ? next : current
}

export function maxIsoDate(
  current: string | null,
  next: string | null | undefined,
): string | null {
  if (!next) return current
  if (!current) return next
  return new Date(next).getTime() > new Date(current).getTime() ? next : current
}
