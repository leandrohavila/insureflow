import { resolveRealEstateBusinessUnitId } from "@/lib/business-units/nav-context"
import type { BusinessUnitContext } from "@/lib/data-access/modules/business-units/types"

export function getPortalOrigin() {
  return (
    process.env.NEXT_PUBLIC_PORTAL_URL?.trim() || "http://localhost:3002"
  ).replace(/\/$/, "")
}

export function getPortalSitemapUrl() {
  return `${getPortalOrigin()}/sitemap.xml`
}

export function getPortalHomeUrl(context?: BusinessUnitContext | null) {
  const origin = getPortalOrigin()
  const unitId = resolveRealEstateBusinessUnitId(context)
  const slug =
    context?.units.find((unit) => unit.id === unitId)?.slug ?? "avila-imoveis"
  return `${origin}/?businessUnitSlug=${encodeURIComponent(slug)}`
}
