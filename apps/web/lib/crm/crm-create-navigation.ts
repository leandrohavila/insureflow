import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

import type { LeadCreateIntent } from "@/lib/leads/lead-intent"

export const CRM_CREATE_LEAD_INSURANCE_HREF = "/leads?create=insurance"
export const CRM_CREATE_LEAD_REAL_ESTATE_HREF = "/leads?create=real-estate"
export const CRM_CREATE_DEAL_HREF = "/crm/negocios?create=deal"

export const CRM_CAPTURE_ACTION_ORDER = [
  "lead-insurance",
  "lead-real-estate",
  "deal",
] as const

export function hrefForLeadCreateIntent(intent: LeadCreateIntent) {
  return intent === "real-estate"
    ? CRM_CREATE_LEAD_REAL_ESTATE_HREF
    : CRM_CREATE_LEAD_INSURANCE_HREF
}

/** Abre o formulário de lead (origem de contatos operacionais). */
export function openCrmCreateLead(
  router: AppRouterInstance,
  intent: LeadCreateIntent = "insurance",
) {
  router.push(hrefForLeadCreateIntent(intent))
}

/** Abre o formulário de negócio no Pipeline (`/crm/negocios`). */
export function openCrmCreateDeal(router: AppRouterInstance) {
  router.push(CRM_CREATE_DEAL_HREF)
}
