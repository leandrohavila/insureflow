export const LEAD_SOURCE_CRM_MANUAL = "crm_manual"
export const LEAD_SOURCE_PUBLIC_PORTAL = "public_portal"

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  [LEAD_SOURCE_CRM_MANUAL]: "Cadastro Manual",
  [LEAD_SOURCE_PUBLIC_PORTAL]: "Portal Imobiliário",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  importacao: "Importação",
}

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
}

/** Espelha `resolveLeadSourceCode` da API (`lead-source.util.ts`). */
export function resolveLeadSourceCode(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return LEAD_SOURCE_CRM_MANUAL
  const key = normalizeKey(value)
  if (key.startsWith(LEAD_SOURCE_PUBLIC_PORTAL)) return LEAD_SOURCE_PUBLIC_PORTAL
  for (const [code, label] of Object.entries(LEAD_SOURCE_LABELS)) {
    if (key === code || key === normalizeKey(label)) return code
  }
  return null
}

/** Rótulo de exibição; origens livres fora do mapa aparecem como digitadas. */
export function formatLeadSource(value: string | null | undefined): string {
  const code = resolveLeadSourceCode(value)
  return (code && LEAD_SOURCE_LABELS[code]) || (value ?? "").trim()
}

export function isManualLeadSource(value: string | null | undefined): boolean {
  return resolveLeadSourceCode(value) === LEAD_SOURCE_CRM_MANUAL
}
