import type { Activity } from "@/lib/data-access/modules/activities"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Customer } from "@/lib/data-access/modules/customers"

import {
  isActivePortfolioCustomer,
  normalizeCustomerLifecycleStage,
  type CustomerLifecycleStage,
} from "./customer-lifecycle"
import { normalizeRenewalStatus, type CustomerRenewalStatus } from "./customer-renewal"

export type CustomerHealthLevel = "excellent" | "good" | "attention" | "risk"

export type PortfolioCustomer = Customer & {
  lifecycleStage: CustomerLifecycleStage
  companyName: string | null
  sourceDealId: string | null
  dealIds: string[]
  products: string[]
  policyCount: number
  renewalDate: string | null
  renewalStatus: CustomerRenewalStatus | null
  renewalPipeline: string | null
  lastInteractionAt: string | null
  healthScore: number
  healthLevel: CustomerHealthLevel
  healthLabel: string
}

export type BuildPortfolioInput = {
  customers: Customer[]
  deals: CrmDeal[]
  activities?: Activity[]
}

function healthLevelFromScore(score: number): CustomerHealthLevel {
  if (score >= 80) return "excellent"
  if (score >= 60) return "good"
  if (score >= 40) return "attention"
  return "risk"
}

function healthLabelFromLevel(level: CustomerHealthLevel): string {
  switch (level) {
    case "excellent":
      return "Carteira saudável"
    case "good":
      return "Estável"
    case "attention":
      return "Requer atenção"
    case "risk":
      return "Em risco"
  }
}

export function computeCustomerHealthScore(input: {
  lifecycleStage: CustomerLifecycleStage
  renewalStatus: CustomerRenewalStatus | null
  renewalDate: string | null
  lastInteractionAt: string | null
  openDealCount: number
}): number {
  let score = 50
  const stage = input.lifecycleStage

  if (stage === "active_customer" || stage === "policy_issued") score += 25
  else if (stage === "onboarding" || stage === "awaiting_policy") score += 10
  else if (stage === "inactive_customer") score -= 15
  else if (stage === "lost_customer") score -= 35

  if (input.renewalStatus === "renewed") score += 15
  else if (input.renewalStatus === "in_progress") score += 5
  else if (input.renewalStatus === "lapsed" || input.renewalStatus === "cancelled") {
    score -= 20
  }

  if (input.renewalDate) {
    const days = Math.ceil(
      (new Date(input.renewalDate).getTime() - Date.now()) / 86_400_000,
    )
    if (days < 0) score -= 15
    else if (days <= 30) score -= 5
    else if (days <= 90) score += 5
  }

  if (input.lastInteractionAt) {
    const daysSince = Math.ceil(
      (Date.now() - new Date(input.lastInteractionAt).getTime()) / 86_400_000,
    )
    if (daysSince <= 7) score += 15
    else if (daysSince <= 30) score += 5
    else if (daysSince > 90) score -= 15
  } else {
    score -= 10
  }

  if (input.openDealCount > 0) score += 5

  return Math.max(0, Math.min(100, score))
}

export function buildPortfolioCustomers({
  customers,
  deals,
  activities = [],
}: BuildPortfolioInput): PortfolioCustomer[] {
  const dealsByCustomer = new Map<string, CrmDeal[]>()
  for (const deal of deals) {
    if (!deal.customerId) continue
    dealsByCustomer.set(deal.customerId, [
      ...(dealsByCustomer.get(deal.customerId) ?? []),
      deal,
    ])
  }

  const lastInteractionByCustomer = new Map<string, string>()
  for (const activity of activities) {
    if (!activity.customerId) continue
    const current = lastInteractionByCustomer.get(activity.customerId)
    if (
      !current ||
      new Date(activity.occurredAt).getTime() > new Date(current).getTime()
    ) {
      lastInteractionByCustomer.set(activity.customerId, activity.occurredAt)
    }
  }

  return customers.map((customer) => {
    const customerDeals = dealsByCustomer.get(customer.id) ?? []
    const lifecycleStage = normalizeCustomerLifecycleStage(customer.lifecycleStage)
    const renewalStatus = normalizeRenewalStatus(customer.renewalStatus)
    const lastInteractionAt =
      lastInteractionByCustomer.get(customer.id) ??
      customerDeals
        .map((deal) => deal.updatedAt)
        .sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime(),
        )[0] ??
      customer.updatedAt

    const openDealCount = customerDeals.filter(
      (deal) => deal.status === "open",
    ).length

    const healthScore = computeCustomerHealthScore({
      lifecycleStage,
      renewalStatus,
      renewalDate: customer.renewalDate ?? null,
      lastInteractionAt,
      openDealCount,
    })

    return {
      ...customer,
      lifecycleStage,
      companyName: customer.companyName ?? null,
      sourceDealId: customer.sourceDealId ?? null,
      dealIds: customerDeals.map((deal) => deal.id),
      products: customerDeals.map((deal) => deal.product).filter(Boolean),
      policyCount: 0,
      renewalDate: customer.renewalDate ?? null,
      renewalStatus,
      renewalPipeline: customer.renewalPipeline ?? null,
      lastInteractionAt,
      healthScore,
      healthLevel: healthLevelFromScore(healthScore),
      healthLabel: healthLabelFromLevel(healthLevelFromScore(healthScore)),
    }
  })
}

export function filterPortfolioCustomers(
  rows: PortfolioCustomer[],
  term: string,
): PortfolioCustomer[] {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return rows

  return rows.filter((row) =>
    [
      row.name,
      row.document,
      row.email,
      row.phone,
      row.companyName,
      row.lifecycleStage,
      row.healthLabel,
      ...row.products,
    ].some((value) => value?.toLowerCase().includes(normalized)),
  )
}

export function portfolioMetrics(rows: PortfolioCustomer[]) {
  const active = rows.filter((row) =>
    isActivePortfolioCustomer(row.lifecycleStage),
  ).length
  const atRisk = rows.filter((row) => row.healthLevel === "risk").length
  const renewalsSoon = rows.filter((row) => {
    if (!row.renewalDate) return false
    const days = Math.ceil(
      (new Date(row.renewalDate).getTime() - Date.now()) / 86_400_000,
    )
    return days >= 0 && days <= 90
  }).length

  return {
    total: rows.length,
    active,
    atRisk,
    renewalsSoon,
  }
}
