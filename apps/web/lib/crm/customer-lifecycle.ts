export const CUSTOMER_LIFECYCLE_STAGES = [
  "won",
  "onboarding",
  "awaiting_policy",
  "policy_issued",
  "active_customer",
  "inactive_customer",
  "lost_customer",
] as const

export type CustomerLifecycleStage = (typeof CUSTOMER_LIFECYCLE_STAGES)[number]

export const CUSTOMER_LIFECYCLE_LABELS: Record<CustomerLifecycleStage, string> =
  {
    won: "Ganho",
    onboarding: "Onboarding",
    awaiting_policy: "Aguardando apólice",
    policy_issued: "Apólice emitida",
    active_customer: "Carteira ativa",
    inactive_customer: "Inativo",
    lost_customer: "Perdido",
  }

export const CUSTOMER_LIFECYCLE_TONES: Record<
  CustomerLifecycleStage,
  "neutral" | "info" | "success" | "warning" | "danger"
> = {
  won: "info",
  onboarding: "info",
  awaiting_policy: "warning",
  policy_issued: "success",
  active_customer: "success",
  inactive_customer: "neutral",
  lost_customer: "danger",
}

const LIFECYCLE_RANK: Record<CustomerLifecycleStage, number> = {
  won: 0,
  onboarding: 1,
  awaiting_policy: 2,
  policy_issued: 3,
  active_customer: 4,
  inactive_customer: 5,
  lost_customer: 6,
}

export function isCustomerLifecycleStage(
  value: string | null | undefined,
): value is CustomerLifecycleStage {
  return (
    typeof value === "string" &&
    (CUSTOMER_LIFECYCLE_STAGES as readonly string[]).includes(value)
  )
}

export function normalizeCustomerLifecycleStage(
  value: string | null | undefined,
): CustomerLifecycleStage {
  return isCustomerLifecycleStage(value) ? value : "won"
}

export function customerLifecycleLabel(
  stage: string | null | undefined,
): string {
  const normalized = normalizeCustomerLifecycleStage(stage)
  return CUSTOMER_LIFECYCLE_LABELS[normalized]
}

export function isOperationalPortfolioStage(
  stage: CustomerLifecycleStage,
): boolean {
  return LIFECYCLE_RANK[stage] >= LIFECYCLE_RANK.onboarding
}

export function isActivePortfolioCustomer(
  stage: string | null | undefined,
): boolean {
  const normalized = normalizeCustomerLifecycleStage(stage)
  return (
    normalized === "active_customer" ||
    normalized === "policy_issued" ||
    normalized === "awaiting_policy" ||
    normalized === "onboarding"
  )
}

/** Pipeline comercial (deal) vs lifecycle operacional (customer). */
export function isCommercialPipelineOnly(dealStatus: string): boolean {
  return dealStatus === "open" || dealStatus === "lost" || dealStatus === "archived"
}

export function lifecycleFromWonDeal(): CustomerLifecycleStage {
  return "won"
}

export function suggestedNextLifecycleStage(
  current: CustomerLifecycleStage,
): CustomerLifecycleStage | null {
  const idx = LIFECYCLE_RANK[current]
  const next = CUSTOMER_LIFECYCLE_STAGES[idx + 1]
  if (!next || next === "inactive_customer" || next === "lost_customer") {
    return null
  }
  return next
}
