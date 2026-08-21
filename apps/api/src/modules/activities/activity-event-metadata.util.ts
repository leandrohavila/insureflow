/** Metadados extensíveis de eventos — serializados em `Activity.outcome` para eventos de sistema. */

const METADATA_VERSION = 1;

export function encodeActivityEventMetadata(
  metadata: Record<string, unknown> | undefined,
): string | null {
  if (!metadata || Object.keys(metadata).length === 0) return null;
  return JSON.stringify({ v: METADATA_VERSION, ...metadata });
}

export function decodeActivityEventMetadata(
  outcome: string | null | undefined,
): Record<string, unknown> | null {
  if (!outcome) return null;
  try {
    const parsed = JSON.parse(outcome) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    if (typeof parsed.v !== 'number') return null;
    const rest = { ...parsed };
    delete rest.v;
    return Object.keys(rest).length > 0 ? rest : null;
  } catch {
    return null;
  }
}
