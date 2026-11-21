export type ActivityLinkKind = "lead" | "deal" | "customer" | "policy"

export type ActivityLinkValue = {
  kind: ActivityLinkKind
  id: string
  title: string
  detail?: string
}

export type ActivityRelationIds = {
  leadId?: string
  dealId?: string
  customerId?: string
  policyId?: string
}

export function activityRelationFromLink(
  link: ActivityLinkValue | null,
): ActivityRelationIds {
  if (!link?.id) return {}
  if (link.kind === "lead") return { leadId: link.id }
  if (link.kind === "deal") return { dealId: link.id }
  if (link.kind === "customer") return { customerId: link.id }
  return { policyId: link.id }
}

export function initialActivityLink(input: {
  leadId?: string | null
  dealId?: string | null
  customerId?: string | null
  policyId?: string | null
  preference?: ActivityLinkKind | null
  title?: string | null
  detail?: string | null
}): ActivityLinkValue | null {
  const detail = input.detail?.trim() || undefined
  const named = (kind: ActivityLinkKind, id: string, fallback: string): ActivityLinkValue => ({
    kind,
    id,
    title: input.title?.trim() || fallback,
    detail,
  })

  if (input.preference === "lead" && input.leadId) {
    return named("lead", input.leadId, "Lead vinculado")
  }
  if (input.preference === "deal" && input.dealId) {
    return named("deal", input.dealId, "Negócio vinculado")
  }
  if (input.preference === "customer" && input.customerId) {
    return named("customer", input.customerId, "Cliente vinculado")
  }
  if (input.preference === "policy" && input.policyId) {
    return named("policy", input.policyId, "Apólice vinculada")
  }
  if (input.dealId) {
    return named("deal", input.dealId, "Negócio vinculado")
  }
  if (input.leadId) {
    return named("lead", input.leadId, "Lead vinculado")
  }
  if (input.customerId) {
    return named("customer", input.customerId, "Cliente vinculado")
  }
  if (input.policyId) {
    return named("policy", input.policyId, "Apólice vinculada")
  }
  return null
}
