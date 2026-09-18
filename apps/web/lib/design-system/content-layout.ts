export type ContentContainerVariant =
  | "operational"
  | "operationalFill"
  | "reading"
  | "modal"
  | "embedded"

/**
 * Mapeamento oficial de variantes semânticas do ContentContainer por contexto de página.
 * Único ponto de decisão — evitar `variant="..."` espalhado sem referência central.
 */
export const dsContentLayoutVariant = {
  dashboard: "operational",
  crm: "operationalFill",
  crmDeals: "operationalFill",
  leads: "operational",
  customers: "operational",
  questionnaires: "operational",
  quotations: "operational",
  policies: "operational",
  claims: "operational",
  automations: "operational",
  settings: "reading",
  profile: "reading",
  help: "reading",
  documentation: "reading",
  leadSheet: "embedded",
  customerSheet: "embedded",
  quotationSheet: "embedded",
} as const satisfies Record<string, ContentContainerVariant>

export type DsContentLayoutKey = keyof typeof dsContentLayoutVariant

export function getContentLayoutVariant(
  key: DsContentLayoutKey,
): ContentContainerVariant {
  return dsContentLayoutVariant[key]
}
