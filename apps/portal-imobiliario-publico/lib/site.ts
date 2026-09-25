/** Domínio canônico do portal. www redireciona para este apex. */
export const OFFICIAL_PORTAL_ORIGIN = "https://grupoavilaimoveis.com.br";

const LOCAL_PORTAL_ORIGIN = "http://localhost:3002";

/** Hosts antigos da Vercel que não podem permanecer como URL canônica. */
export const LEGACY_PORTAL_HOSTS = [
  "insureflow-portal-imobiliario-publico.vercel.app",
  "insureflow-portal-imobiliario-publi.vercel.app",
  "insureflow-portal-imobiliario-publico-leandro-avila-s-projects.vercel.app",
  "portal-imobiliario-publico.vercel.app",
] as const;

export function isLegacyPortalOrigin(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return (LEGACY_PORTAL_HOSTS as readonly string[]).includes(host);
  } catch {
    return false;
  }
}

export function portalOrigin() {
  const configured = (
    process.env.PORTAL_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_PORTAL_URL?.trim() ||
    ""
  ).replace(/\/$/, "");

  if (configured && !isLegacyPortalOrigin(configured)) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return OFFICIAL_PORTAL_ORIGIN;
  }

  return configured || LOCAL_PORTAL_ORIGIN;
}

export function toAbsoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${portalOrigin()}${path}`;
}
