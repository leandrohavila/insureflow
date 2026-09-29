import type { Prisma } from '@prisma/client';

export const LEAD_SOURCE_CRM_MANUAL = 'crm_manual';
export const LEAD_SOURCE_PUBLIC_PORTAL = 'public_portal';

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  [LEAD_SOURCE_CRM_MANUAL]: 'Cadastro Manual',
  [LEAD_SOURCE_PUBLIC_PORTAL]: 'Portal Imobiliário',
  whatsapp: 'WhatsApp',
  indicacao: 'Indicação',
  importacao: 'Importação',
};

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

/**
 * Converte código ou rótulo (ex.: `whatsapp`, `WhatsApp`, `Cadastro Manual`)
 * no código canônico. Variantes `public_portal_*` contam como portal.
 */
export function resolveLeadSourceCode(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return LEAD_SOURCE_CRM_MANUAL;
  const key = normalizeKey(value);
  if (key.startsWith(LEAD_SOURCE_PUBLIC_PORTAL)) {
    return LEAD_SOURCE_PUBLIC_PORTAL;
  }
  for (const [code, label] of Object.entries(LEAD_SOURCE_LABELS)) {
    if (key === code || key === normalizeKey(label)) return code;
  }
  return null;
}

export function defaultManualLeadSource(
  source: string | null | undefined,
): string {
  return source?.trim() || LEAD_SOURCE_CRM_MANUAL;
}

/** Filtro de listagem: leads sem origem entram em "Cadastro Manual". */
export function buildLeadSourceWhere(
  value: string | null | undefined,
): Prisma.LeadWhereInput | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;

  const code = resolveLeadSourceCode(raw);
  if (!code) return { source: raw };

  if (code === LEAD_SOURCE_PUBLIC_PORTAL) {
    return {
      source: { startsWith: LEAD_SOURCE_PUBLIC_PORTAL, mode: 'insensitive' },
    };
  }

  const variants: Prisma.LeadWhereInput[] = [
    { source: { equals: code, mode: 'insensitive' } },
    { source: { equals: LEAD_SOURCE_LABELS[code], mode: 'insensitive' } },
  ];
  if (code === LEAD_SOURCE_CRM_MANUAL) {
    variants.push({ source: null }, { source: '' });
  }
  return { OR: variants };
}
