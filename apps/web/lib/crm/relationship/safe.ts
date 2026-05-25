import type { RelationshipIndex } from "./types"

/** Coerce unknown runtime values into a safe string for identity/search ops. */
export function normalizeIdentityValue(value: unknown): string {
  if (typeof value === "string") return value
  if (value == null) return ""
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeIdentityValue(item))
      .filter(Boolean)
      .join(" ")
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  return ""
}

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

export function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => normalizeIdentityValue(item)).filter(Boolean)
}

export function warnRelationshipIndex(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.warn("[relationship-index]", message, detail)
  }
}

export function emptyRelationshipIndex(): RelationshipIndex {
  return {
    contacts: [],
    companies: [],
    contactsById: new Map(),
    companiesById: new Map(),
  }
}
