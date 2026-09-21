export { COMMERCIAL_AUTO_REFRESH_MS } from "./commercial-auto-refresh"

export const REACTIVATION_CAMPAIGNS_PATH = "/crm/campaigns/reactivation"
export const REACTIVATION_CAMPAIGNS_PT_ALIAS = "/crm/campanhas-reativacao"

export function reactivationCampaignPath(id?: string) {
  return id
    ? `${REACTIVATION_CAMPAIGNS_PATH}/${id}`
    : REACTIVATION_CAMPAIGNS_PATH
}

/** Resolve o alias PT-BR para a rota canônica, sem duplicar a página. */
export function resolveReactivationCampaignAlias(
  pathname: string,
): string | null {
  const path = pathname.split("?")[0] ?? pathname
  if (
    path === REACTIVATION_CAMPAIGNS_PT_ALIAS ||
    path === `${REACTIVATION_CAMPAIGNS_PT_ALIAS}/`
  ) {
    return REACTIVATION_CAMPAIGNS_PATH
  }
  if (path.startsWith(`${REACTIVATION_CAMPAIGNS_PT_ALIAS}/`)) {
    const rest = path.slice(REACTIVATION_CAMPAIGNS_PT_ALIAS.length)
    return `${REACTIVATION_CAMPAIGNS_PATH}${rest}`
  }
  return null
}

export function canEditReactivationCampaign(
  status: string | null | undefined,
) {
  return status === "DRAFT"
}

export function buildCampaignUpdatePayload(input: {
  name: string
  description: string
  ownerUserId: string
}) {
  const name = input.name.trim()
  const ownerUserId = input.ownerUserId.trim()
  return {
    name,
    description: input.description.trim() || null,
    ...(ownerUserId ? { ownerUserId } : {}),
  }
}
