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

export function getPortalHomeUrl(
  context: BusinessUnitContext | null | undefined,
  origin: string,
) {
  const base = normalizePortalOrigin(origin) || LOCAL_PORTAL_ORIGIN
  const unitId = resolveRealEstateBusinessUnitId(context)
  const slug =
    context?.units.find((unit) => unit.id === unitId)?.slug ?? "avila-imoveis"
  return `${base}/?businessUnitSlug=${encodeURIComponent(slug)}`
}
