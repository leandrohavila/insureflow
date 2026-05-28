"use client"

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react"
import {
  canManage,
  hasAnyPermission,
  hasPermission,
  showMineLeadsFilter,
  type DataScope,
  type Permission,
  type SessionPayload,
} from "@repo/auth"
import type { UseQueryResult } from "@tanstack/react-query"

import { useSessionQuery } from "@/lib/data-access/modules/session"

type ManageablePermission = Extract<Permission, `${string}:view`>

type SessionContextValue = {
  session: SessionPayload | null
  permissions: ReadonlySet<Permission>
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: UseQueryResult<SessionPayload>["refetch"]
}

const SessionContext = createContext<SessionContextValue | null>(null)

type SessionProviderProps = {
  initialSession: SessionPayload
  children: ReactNode
}

export function SessionProvider({
  initialSession,
  children,
}: SessionProviderProps) {
  const sessionQuery = useSessionQuery({ initialSession })
  const session = sessionQuery.data ?? null
  const permissions = useMemo(
    () => new Set(session?.permissions ?? []),
    [session?.permissions],
  )

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      permissions,
      isLoading: sessionQuery.isLoading,
      isError: sessionQuery.isError,
      error: sessionQuery.error,
      refetch: sessionQuery.refetch,
    }),
    [
      permissions,
      session,
      sessionQuery.error,
      sessionQuery.isError,
      sessionQuery.isLoading,
      sessionQuery.refetch,
    ],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within SessionProvider")
  }
  return context
}

export function usePermission(permission: Permission) {
  const { session } = useSession()
  return hasPermission(session, permission)
}

export function useAnyPermission(permissions: readonly Permission[]) {
  const { session } = useSession()
  return hasAnyPermission(session, [...permissions])
}

export function useCanManage(permission: ManageablePermission) {
  return usePermission(canManage(permission))
}

export function useDataScope(): DataScope | undefined {
  const { session } = useSession()
  return session?.dataScope
}

export function useShowMineLeadsFilter(): boolean {
  const { session } = useSession()
  return showMineLeadsFilter(session)
}
