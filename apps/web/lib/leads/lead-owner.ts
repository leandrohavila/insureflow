import type { Lead } from "@/lib/data-access/modules/leads"

export function leadOwnerDisplayName(lead: Pick<Lead, "owner" | "assignedTo">) {
  return lead.owner?.name?.trim() || lead.assignedTo?.trim() || ""
}

export function leadOwnerInitials(
  lead: Pick<Lead, "owner" | "assignedTo" | "initials">,
) {
  const ownerName = leadOwnerDisplayName(lead)
  if (ownerName) {
    return (
      ownerName
        .split(/\s+|[._-]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "IF"
    )
  }
  return lead.initials?.slice(0, 2) || "LD"
}

export function isLeadConverted(lead: Pick<Lead, "dealId" | "status">) {
  return Boolean(lead.dealId) || lead.status === "converted"
}
