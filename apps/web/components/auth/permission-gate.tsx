"use client"

import type { ReactNode } from "react"
import {
  hasAnyPermission,
  hasPermission,
  type Permission,
} from "@repo/auth"

import { useSession } from "@/components/auth/session-provider"

type PermissionGateProps =
  | {
      permission: Permission
      anyOf?: never
      fallback?: ReactNode
      children: ReactNode
    }
  | {
      permission?: never
      anyOf: readonly Permission[]
      fallback?: ReactNode
      children: ReactNode
    }

export function PermissionGate({
  permission,
  anyOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { session } = useSession()
  const allowed = permission
    ? hasPermission(session, permission)
    : hasAnyPermission(session, [...anyOf])

  return allowed ? children : fallback
}
