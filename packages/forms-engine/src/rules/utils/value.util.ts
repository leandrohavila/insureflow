export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === "string") return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === "boolean") return false
  if (typeof value === "number") return Number.isNaN(value)
  return false
}

export function toStringValue(value: unknown): string {
  if (value === undefined || value === null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map((item) => toStringValue(item)).join(",")
  return String(value)
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."))
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

export function normalizeComparable(value: unknown): unknown {
  if (value === undefined || value === null) return null
  if (typeof value === "string") return value.trim().toLowerCase()
  if (typeof value === "boolean" || typeof value === "number") return value
  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparable(item))
  }
  return value
}
