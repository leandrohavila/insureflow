import type { AppRole, Permission, SessionPayload, SessionUser } from "./types"
import { getPermissionsForRole } from "./roles"

export function hasPermission(
  session: Pick<SessionPayload, "permissions" | "role"> | null | undefined,
  permission: Permission
): boolean {
  if (!session) return false
  if (session.role === "super_admin") return true
  return session.permissions.includes(permission)
}

export function hasAnyPermission(
  session: Pick<SessionPayload, "permissions" | "role"> | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(session, p))
}

export function hasAllPermissions(
  session: Pick<SessionPayload, "permissions" | "role"> | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(session, p))
}

export function canManage(permission: Permission): Permission {
  return permission.replace(":view", ":manage") as Permission
}

export function buildSessionPayload(user: SessionUser): SessionPayload {
  return {
    ...user,
    permissions: getPermissionsForRole(user.role),
  }
}

export function isRoleAtLeast(role: AppRole, minimum: AppRole): boolean {
  const order: AppRole[] = ["viewer", "broker", "underwriter", "admin", "super_admin"]
  return order.indexOf(role) >= order.indexOf(minimum)
}
