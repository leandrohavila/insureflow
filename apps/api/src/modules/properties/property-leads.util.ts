import type { Prisma } from '@prisma/client';

export const PROPERTY_LEAD_METADATA_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'ttclid',
  'landingPage',
  'referrer',
  'device',
  'placement',
  'filters',
  'event_id',
] as const;

const METADATA_KEY_SET = new Set<string>(PROPERTY_LEAD_METADATA_KEYS);

export type PropertyLeadInboxRow = {
  id: string;
  tenantId: string;
  businessUnitId: string;
  propertyId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  property?: {
    id: string;
    title: string;
    slug: string;
  } | null;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isScalar(value: unknown): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/** Persiste só chaves de atribuição conhecidas. Não concatena UTM em message. */
export function sanitizePropertyLeadMetadata(
  raw?: Record<string, unknown> | null,
): Prisma.InputJsonValue | null {
  if (!raw || !isPlainObject(raw)) return null;

  const out: Record<string, Prisma.InputJsonValue> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!METADATA_KEY_SET.has(key)) continue;
    if (value === undefined || value === null || value === '') continue;
    if (key === 'filters') {
      if (isPlainObject(value)) {
        out[key] = value as Prisma.InputJsonObject;
      }
      continue;
    }
    if (isScalar(value)) {
      out[key] = value;
    }
  }

  return Object.keys(out).length ? out : null;
}

export function serializePropertyLead(row: PropertyLeadInboxRow) {
  const property = row.property ?? null;
  return {
    id: row.id,
    tenantId: row.tenantId,
    businessUnitId: row.businessUnitId,
    propertyId: row.propertyId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    source: row.source,
    metadata: row.metadata,
    createdAt: row.createdAt,
    propertyTitle: property?.title ?? null,
    propertySlug: property?.slug ?? null,
    property: property
      ? { id: property.id, title: property.title, slug: property.slug }
      : null,
  };
}
