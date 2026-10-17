const PRODUCTION_ORIGIN = "https://grupoavilaimoveis.com.br";

function isLocalHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local");
}

function httpsOrigin(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (isLocalHost(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function configuredOrigin() {
  return (
    httpsOrigin(process.env.PORTAL_PUBLIC_URL ?? "") ||
    httpsOrigin(process.env.NEXT_PUBLIC_PORTAL_URL ?? "")
  );
}

function deploymentOrigin() {
  if (process.env.VERCEL_ENV === "production") {
    return httpsOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "") || PRODUCTION_ORIGIN;
  }
  if (process.env.VERCEL_ENV === "preview") {
    return httpsOrigin(process.env.VERCEL_URL ?? "");
  }
  return null;
}

export function portalOrigin() {
  return configuredOrigin() || deploymentOrigin() || "http://localhost:3002";
}

export function toAbsoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${portalOrigin()}${path}`;
}
