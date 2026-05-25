import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

/** Abre o formulário de lead (origem de contatos operacionais). */
export function openCrmCreateLead(router: AppRouterInstance) {
  router.push("/leads?create=lead")
}

/** Abre o formulário de negócio (origem de empresas operacionais). */
export function openCrmCreateDeal(router: AppRouterInstance) {
  router.push("/crm/negocios?create=deal")
}
