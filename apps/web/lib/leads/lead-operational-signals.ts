import type { Lead } from "@/lib/data-access/modules/leads"

export type LeadPriority = "high" | "medium" | "low"

export function leadHasNoContact(lead: Lead): boolean {
  return (
    lead.status === "new" &&
    !lead.lastContactAt &&
    !lead.lastInteractionAt
  )
}

export function deriveLeadPriority(lead: Lead): LeadPriority {
  if (leadHasNoContact(lead) || lead.status === "new") return "high"
  if (lead.status === "contacted") return "medium"
  return "low"
}

export const LEAD_PRIORITY_LABEL: Record<LeadPriority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
}
