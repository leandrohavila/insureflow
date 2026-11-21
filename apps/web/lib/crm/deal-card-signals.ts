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

export type DealCardNextAction = {
  label: string
  overdue: boolean
}

export type DealCardFacts = {
  client: string | null
  branch: string | null
  owner: string | null
  next: DealCardNextAction | null
}

function present(value?: string | null) {
  const text = value?.trim()
  if (!text || text === "Sem responsável") return null
  return text
}

function formatCardDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

/** Só exibe o que o negócio já tem. Ramo vem da unidade; sem unidade, não há ramo. */
export function dealCardFacts(
  deal: Pick<
    CrmDeal,
    "company" | "contact" | "owner" | "assignedTo" | "businessUnit" | "sla"
  >,
): DealCardFacts {
  const company = present(deal.company)
  const contact = present(deal.contact)
  const client = company ?? (contact && contact !== company ? contact : null)
  const branch =
    deal.businessUnit?.type === "REAL_ESTATE"
      ? "Imóvel"
      : deal.businessUnit?.type === "INSURANCE"
        ? "Seguro"
        : null
  const due = deal.sla?.dueAt ? formatCardDate(deal.sla.dueAt) : null
  let next: DealCardNextAction | null = null
  if (deal.sla?.status === "overdue") {
    next = {
      label: due ? `Atrasada · ${due}` : "Atividade atrasada",
      overdue: true,
    }
  } else if (due) {
    next = { label: due, overdue: false }
  } else if (deal.sla?.status === "warning") {
    next = { label: "Em alerta", overdue: false }
  }

  return {
    client,
    branch,
    owner: present(deal.assignedTo) ?? present(deal.owner),
    next,
  }
}

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
