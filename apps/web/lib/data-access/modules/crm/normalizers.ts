import type { BackendCrmDeal, CrmDeal } from "./types"
import { formatLastInteractionShort } from "@/lib/crm/last-interaction"
import { normalizePipelineOrder } from "@/lib/pipeline-order"

function initials(value: string) {
  return (
    value
      .split(/\s+|[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "IF"
  )
}

export function normalizeDeal(deal: BackendCrmDeal): CrmDeal {
  const owner = deal.assignedTo?.trim() || "Sem responsável"
  const value = Number(deal.value)
  const convertedLead = deal.convertedLead?.id
    ? {
        id: deal.convertedLead.id,
        name: deal.convertedLead.name?.trim() || "Lead",
        assignedTo: deal.convertedLead.assignedTo?.trim() || null,
        status: deal.convertedLead.status ?? null,
        phone: deal.convertedLead.phone?.trim() || null,
        email: deal.convertedLead.email?.trim() || null,
        lastContactAt: deal.convertedLead.lastContactAt ?? null,
      }
    : null

  const lastInteractionAt = deal.commercialContext?.lastInteractionAt
  const lastActivity = formatLastInteractionShort(lastInteractionAt)

  return {
    ...deal,
    value,
    pipelineOrder: normalizePipelineOrder(deal.pipelineOrder),
    contact: deal.company,
    owner,
    ownerInitials: initials(owner),
    priority: value >= 50000 ? "alta" : value >= 15000 ? "media" : "baixa",
    product: "Seguro",
    lastActivity,
    tags: [
      deal.status === "won"
        ? "Ganho"
        : deal.status === "lost"
          ? "Perdido"
          : "Aberto",
    ],
    convertedLead,
    commercialContext: deal.commercialContext ?? null,
    customerId: deal.customerId ?? null,
    wonAt: deal.wonAt ?? null,
  }
}
