import { resolveRealEstateBusinessUnitId } from "@/lib/business-units/nav-context"
import type { BusinessUnitContext } from "@/lib/data-access/modules/business-units/types"

export const LOCAL_PORTAL_ORIGIN = "http://localhost:3002"
export const OFFICIAL_PORTAL_ORIGIN = "https://grupoavilaimoveis.com.br"

const LEGACY_PORTAL_HOSTS = [
  "insureflow-portal-imobiliario-publico.vercel.app",
  "insureflow-portal-imobiliario-publi.vercel.app",
  "insureflow-portal-imobiliario-publico-leandro-avila-s-projects.vercel.app",
  "portal-imobiliario-publico.vercel.app",
]

export function normalizePortalOrigin(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.replace(/\/$/, "")
}

function isLegacyPortalOrigin(value: string) {
  try {
    return LEGACY_PORTAL_HOSTS.includes(new URL(value).hostname.toLowerCase())
  } catch {
    return false
  }
}

export function resolvePortalOrigin(
  portalPublicUrl?: string | null,
  legacyPublicUrl?: string | null,
) {
  const configured =
    normalizePortalOrigin(portalPublicUrl) || normalizePortalOrigin(legacyPublicUrl)
  if (configured && !isLegacyPortalOrigin(configured)) return configured
  if (process.env.NODE_ENV === "production") return OFFICIAL_PORTAL_ORIGIN
  return configured || LOCAL_PORTAL_ORIGIN
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
