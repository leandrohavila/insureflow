import { PRIORITY_ACCENT_VAR, STAGE_ACCENT_VAR } from "./deal-accents"
import { formatLastInteractionShort } from "./last-interaction"
import type { CrmDeal } from "@/lib/data-access/modules/crm"

/** Dias sem interação para sinalizar risco operacional no card. */
const STALE_INTERACTION_DAYS = 7

export type DealCardSignal =
  | "priority-high"
  | "stale-interaction"
  | "no-interaction"
  | "questionnaire-pending"

export type DealCardSignals = {
  accentVar: string
  priorityAccentVar: string
  isStale: boolean
  signals: DealCardSignal[]
  interactionLabel: string
}

function interactionAgeDays(iso: string | null | undefined): number | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Deriva accents e indicadores operacionais do card a partir do `CrmDeal`
 * existente — sem fetch adicional.
 */
export function getDealCardSignals(deal: CrmDeal): DealCardSignals {
  const lastAt = deal.commercialContext?.lastInteractionAt ?? null
  const ageDays = interactionAgeDays(lastAt)
  const signals: DealCardSignal[] = []

  if (deal.priority === "alta") signals.push("priority-high")

  if (ageDays === null) {
    signals.push("no-interaction")
  } else if (ageDays >= STALE_INTERACTION_DAYS) {
    signals.push("stale-interaction")
  }

  const qStatus =
    deal.commercialContext?.questionnaire.status ??
    (deal.convertedLead ? "pending" : null)
  if (qStatus === "pending") signals.push("questionnaire-pending")

  const isStale =
    signals.includes("stale-interaction") ||
    signals.includes("no-interaction")

  return {
    accentVar:
      deal.priority === "alta"
        ? PRIORITY_ACCENT_VAR.alta
        : STAGE_ACCENT_VAR[deal.stage],
    priorityAccentVar: PRIORITY_ACCENT_VAR[deal.priority],
    isStale,
    signals,
    interactionLabel: formatLastInteractionShort(lastAt) || deal.lastActivity,
  }
}
