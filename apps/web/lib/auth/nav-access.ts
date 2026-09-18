import { getNavPermission } from "@/lib/navigation"
import { hasPermission, type SessionPayload } from "@repo/auth"

const REAL_ESTATE_PREFIX = "real-estate"

export function canAccessSegment(
  session: SessionPayload | null | undefined,
  segment: string
): boolean {
  if (!segment) {
    return hasPermission(session, "dashboard:view")
  }
  if (segment === REAL_ESTATE_PREFIX) {
    return hasPermission(session, "properties:view")
  }
  const permission = getNavPermission(segment)
  if (!permission) return false
  return hasPermission(session, permission)
}

export function canAccessPathname(
  session: SessionPayload | null | undefined,
  pathname: string,
): boolean {
  if (!pathname || pathname === "/") {
    return canAccessSegment(session, "")
  }
  if (pathname.startsWith("/real-estate")) {
    return hasPermission(session, "properties:view")
  }
  const segment = pathname.split("/").filter(Boolean)[0] ?? ""
  return canAccessSegment(session, segment)
}
