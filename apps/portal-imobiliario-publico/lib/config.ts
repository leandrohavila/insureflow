export function getCatalogConfig() {
  const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG?.trim() || "insureflow";
  const businessUnitSlug =
    process.env.NEXT_PUBLIC_BUSINESS_UNIT_SLUG?.trim() || "avila-imoveis";
  const forceMock = process.env.NEXT_PUBLIC_PORTAL_USE_MOCK === "true";
  const remoteBase = (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
  const apiBase = typeof window === "undefined" ? remoteBase : "";

  return { tenantSlug, businessUnitSlug, forceMock, apiBase };
}

export function publicQueryDefaults() {
  const { tenantSlug, businessUnitSlug } = getCatalogConfig();
  return { tenantSlug, businessUnitSlug };
}
