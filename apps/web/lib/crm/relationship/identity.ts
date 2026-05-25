import { stripDocumentDigits } from "@/lib/documents/document"

import { normalizeIdentityValue } from "./safe"
import type { IdentityKey, IdentityLinkKind } from "./types"

function slugify(value: unknown): string {
  const safe = normalizeIdentityValue(value)
  if (!safe) return ""

  return safe
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

export function normalizeEmail(value: unknown): string | null {
  const trimmed = normalizeIdentityValue(value).trim().toLowerCase()
  if (!trimmed || !trimmed.includes("@")) return null
  return trimmed
}

export function normalizePhoneDigits(value: unknown): string | null {
  const digits = stripDocumentDigits(normalizeIdentityValue(value))
  if (digits.length < 10) return null
  return digits.slice(-11)
}

export function normalizeCompanyName(value: unknown): string {
  return normalizeIdentityValue(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

export function companyIdFromName(name: unknown): string {
  const normalized = normalizeCompanyName(name)
  return normalized ? `company:${slugify(normalized)}` : "company:unknown"
}

export function domainFromCompanyName(name: unknown): string {
  const slug =
    slugify(name).replace(/-/g, "").slice(0, 24) || "empresa"
  return `${slug}.crm`
}

function buildIdentityKey(
  kind: IdentityLinkKind,
  raw: string,
): IdentityKey {
  return {
    id: `${kind}:${slugify(raw) || "unknown"}`,
    kind,
    raw,
  }
}

export type ResolveIdentityInput = {
  name?: unknown
  email?: unknown
  phone?: unknown
  document?: unknown
  company?: unknown
}

/**
 * Resolve a chave canônica de identidade operacional.
 * Prioridade: documento > e-mail > telefone > nome+empresa.
 */
export function resolveIdentityKey(input: ResolveIdentityInput): IdentityKey {
  const documentDigits = stripDocumentDigits(normalizeIdentityValue(input.document))
  if (documentDigits.length === 11 || documentDigits.length === 14) {
    return buildIdentityKey("document", documentDigits)
  }

  const email = normalizeEmail(input.email)
  if (email) return buildIdentityKey("email", email)

  const phone = normalizePhoneDigits(input.phone)
  if (phone) return buildIdentityKey("phone", phone)

  const nameSlug = slugify(input.name || "contato") || "contato"
  const companySlug = slugify(input.company ?? "")
  const composite = companySlug ? `${nameSlug}|${companySlug}` : nameSlug
  return buildIdentityKey("name", composite)
}

export function contactIdFromIdentity(identity: IdentityKey): string {
  return `contact:${identity.id}`
}

export function initialsFromName(name: unknown): string {
  const safe = normalizeIdentityValue(name).trim()
  if (!safe) return "IF"

  return (
    safe
      .split(/\s+|[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "IF"
  )
}

export function matchesSearchTerm(
  term: unknown,
  values: Array<unknown>,
): boolean {
  const normalized = normalizeIdentityValue(term).trim().toLowerCase()
  if (!normalized) return true

  const digits = stripDocumentDigits(normalized)
  const hasDigitSearch = digits.length >= 3

  return values.some((value) => {
    const safe = normalizeIdentityValue(value)
    if (!safe) return false
    const lower = safe.toLowerCase()
    if (lower.includes(normalized)) return true
    if (hasDigitSearch) {
      const valueDigits = stripDocumentDigits(safe)
      if (valueDigits.includes(digits)) return true
    }
    return false
  })
}

export { normalizeIdentityValue } from "./safe"
