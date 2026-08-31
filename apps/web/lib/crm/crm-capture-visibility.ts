export type CrmCaptureVisibility = {
  showLeadInsurance: boolean
  showLeadRealEstate: boolean
  showDeal: boolean
}

/**
 * Isolamento de permissão: leads:manage e crm:manage são independentes.
 * Faltar uma não pode esconder a outra.
 */
export function resolveCrmCaptureVisibility(input: {
  canManageLeads: boolean
  canManageCrm: boolean
}): CrmCaptureVisibility {
  return {
    showLeadInsurance: input.canManageLeads,
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
