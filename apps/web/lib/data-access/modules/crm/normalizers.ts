import type { BackendCrmDeal, CrmDeal } from "./types"

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

  return {
    ...deal,
    value,
    contact: deal.company,
    owner,
    ownerInitials: initials(owner),
    priority: value >= 50000 ? "alta" : value >= 15000 ? "media" : "baixa",
    product: "Seguro",
    lastActivity: "Agora",
    tags: [
      deal.status === "won"
        ? "Ganho"
        : deal.status === "lost"
          ? "Perdido"
          : "Aberto",
    ],
  }
}
