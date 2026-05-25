export const CUSTOMER_RENEWAL_STATUSES = [
  "pending",
  "in_progress",
  "renewed",
  "lapsed",
  "cancelled",
] as const

export type CustomerRenewalStatus = (typeof CUSTOMER_RENEWAL_STATUSES)[number]

export const CUSTOMER_RENEWAL_PIPELINES = ["default", "retention", "expansion"] as const

export type CustomerRenewalPipeline = (typeof CUSTOMER_RENEWAL_PIPELINES)[number]

export const RENEWAL_STATUS_LABELS: Record<CustomerRenewalStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  renewed: "Renovado",
  lapsed: "Vencido",
  cancelled: "Cancelado",
}

export const RENEWAL_PIPELINE_LABELS: Record<CustomerRenewalPipeline, string> =
  {
    default: "Renovação padrão",
    retention: "Retenção",
    expansion: "Expansão",
  }

export function isCustomerRenewalStatus(
  value: string | null | undefined,
): value is CustomerRenewalStatus {
  return (
    typeof value === "string" &&
    (CUSTOMER_RENEWAL_STATUSES as readonly string[]).includes(value)
  )
}

export function normalizeRenewalStatus(
  value: string | null | undefined,
): CustomerRenewalStatus | null {
  return isCustomerRenewalStatus(value) ? value : null
}

export function renewalStatusLabel(value: string | null | undefined): string {
  const normalized = normalizeRenewalStatus(value)
  return normalized ? RENEWAL_STATUS_LABELS[normalized] : "Não definido"
}

export function daysUntilRenewal(
  renewalDate: string | null | undefined,
): number | null {
  if (!renewalDate) return null
  const time = new Date(renewalDate).getTime()
  if (!Number.isFinite(time)) return null
  return Math.ceil((time - Date.now()) / 86_400_000)
}

export function renewalUrgency(
  renewalDate: string | null | undefined,
): "none" | "soon" | "overdue" {
  const days = daysUntilRenewal(renewalDate)
  if (days === null) return "none"
  if (days < 0) return "overdue"
  if (days <= 90) return "soon"
  return "none"
}

export type RenewalFoundation = {
  renewalDate: string | null
  renewalStatus: CustomerRenewalStatus | null
  renewalPipeline: CustomerRenewalPipeline | null
}

export function emptyRenewalFoundation(): RenewalFoundation {
  return {
    renewalDate: null,
    renewalStatus: "pending",
    renewalPipeline: "default",
  }
}
