export function portalOrigin() {
  return (
    process.env.NEXT_PUBLIC_PORTAL_URL?.trim() ||
    "http://localhost:3002"
  ).replace(/\/$/, "");
}

export function toAbsoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${portalOrigin()}${path}`;
}
