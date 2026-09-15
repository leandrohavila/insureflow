export type CrmCaptureModule = "crm" | "real-estate"

export type CrmCaptureVisibility = {
  showLeadInsurance: boolean
  showLeadRealEstate: boolean
  showDeal: boolean
}

/**
 * Isolamento de permissão: leads:manage e crm:manage são independentes.
 * Faltar uma não pode esconder a outra.
 *
 * `module: "real-estate"` é a visão filtrada da Ávila Imóveis:
 * Lead Seguro não entra (BU travada). Novo Negócio continua em crm:manage.
 */
export function resolveCrmCaptureVisibility(input: {
  canManageLeads: boolean
  canManageCrm: boolean
  module?: CrmCaptureModule
}): CrmCaptureVisibility {
  const captureModule = input.module ?? "crm"
  return {
    showLeadInsurance: input.canManageLeads && captureModule !== "real-estate",
    showLeadRealEstate: input.canManageLeads,
    showDeal: input.canManageCrm,
  }
}

export function hasAnyCrmCaptureAction(visibility: CrmCaptureVisibility) {
  return (
    visibility.showLeadInsurance ||
    visibility.showLeadRealEstate ||
    visibility.showDeal
  )
}
