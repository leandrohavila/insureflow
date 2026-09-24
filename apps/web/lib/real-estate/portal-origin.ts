import { resolvePortalOrigin } from "@/lib/real-estate/portal-url"

/** Lida apenas em Server Components. O dashboard recebe a origem pronta. */
export function getPortalOrigin() {
  return resolvePortalOrigin(
    process.env.PORTAL_PUBLIC_URL,
    process.env.NEXT_PUBLIC_PORTAL_URL,
  )
}
