export const TEMPLATE_SETTINGS_AUTOSAVE_DEBOUNCE_MS = 600

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortForStableStringify(value))
}

export function hashSettings(
  settings: Record<string, unknown> | null | undefined,
): string {
  return stableStringify(settings ?? {})
}

export function settingsPayloadsEqual(
  left: Record<string, unknown> | null | undefined,
  right: Record<string, unknown> | null | undefined,
): boolean {
  return hashSettings(left) === hashSettings(right)
}

function sortForStableStringify(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(sortForStableStringify)
  }

  const record = value as Record<string, unknown>
  return Object.keys(record)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortForStableStringify(record[key])
      return acc
    }, {})
}
