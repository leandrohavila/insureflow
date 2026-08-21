"use client"

import type { CrmDeal } from "@/lib/data-access/modules/crm"

import { DealQuotesHub } from "./deal-quotes-hub"

type DealQuotesSectionProps = {
  deal: CrmDeal
  crmReturnHref?: string
}

export function DealQuotesSection({
  deal,
  crmReturnHref,
}: DealQuotesSectionProps) {
  return <DealQuotesHub deal={deal} crmReturnHref={crmReturnHref} />
}
