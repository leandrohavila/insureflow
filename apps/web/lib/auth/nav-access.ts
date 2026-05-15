import { getNavPermission } from "@/lib/navigation"
import { hasPermission, type SessionPayload } from "@repo/auth"

export function canAccessSegment(
  session: SessionPayload | null | undefined,
  segment: string
): boolean {
  if (!segment) {
    return hasPermission(session, "dashboard:view")
  }
  const permission = getNavPermission(segment)
  if (!permission) return false
  return hasPermission(session, permission)
}
