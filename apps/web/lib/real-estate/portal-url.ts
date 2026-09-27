import { resolveRealEstateBusinessUnitId } from "@/lib/business-units/nav-context"
import type { BusinessUnitContext } from "@/lib/data-access/modules/business-units/types"

export const LOCAL_PORTAL_ORIGIN = "http://localhost:3002"

export function normalizePortalOrigin(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.replace(/\/$/, "")
}

export function resolvePortalOrigin(
  portalPublicUrl?: string | null,
  legacyPublicUrl?: string | null,
) {
  return (
    normalizePortalOrigin(portalPublicUrl) ||
    normalizePortalOrigin(legacyPublicUrl) ||
    LOCAL_PORTAL_ORIGIN
  )
}

export function getPortalSitemapUrl(origin: string) {
  const base = normalizePortalOrigin(origin) || LOCAL_PORTAL_ORIGIN
  return `${base}/sitemap.xml`
}

export const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidPublicSlug(value: string) {
  return PUBLIC_SLUG_PATTERN.test(value)
}

export function isValidPortalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function getRealEstateUnitSlug(
  context: BusinessUnitContext | null | undefined,
) {
  const unitId = resolveRealEstateBusinessUnitId(context)
  return (
    context?.units.find((unit) => unit.id === unitId)?.slug ?? "avila-imoveis"
  )
}

export function buildPortalPublicUrl(origin: string, slug: string) {
  const base = normalizePortalOrigin(origin) || LOCAL_PORTAL_ORIGIN
  return `${base}/?businessUnitSlug=${encodeURIComponent(slug)}`
}

export function getPortalHomeUrl(
  context: BusinessUnitContext | null | undefined,
  origin: string,
) {
  return buildPortalPublicUrl(origin, getRealEstateUnitSlug(context))
}
