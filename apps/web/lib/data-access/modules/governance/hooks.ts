"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import { fetchAuditLogs, type AuditLogsQuery } from "./audit-api"
import { fetchPermissions, fetchRolesWithPermissions } from "./permissions-api"
import { fetchUser, fetchUsers } from "./users-api"

export function useGovernancePermissions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.governance.permissions(),
    queryFn: fetchPermissions,
    enabled,
  })
}

export function useGovernanceRoles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.governance.roles(),
    queryFn: fetchRolesWithPermissions,
    enabled,
  })
}

export function useGovernanceUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.governance.users(),
    queryFn: fetchUsers,
    enabled,
    retry: false,
  })
}

export function useGovernanceUser(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.governance.user(id),
    queryFn: () => fetchUser(id),
    enabled: enabled && Boolean(id),
    retry: false,
  })
}

export function useAuditLogs(query: AuditLogsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.governance.auditLogs(query),
    queryFn: () => fetchAuditLogs(query),
    enabled,
    retry: false,
  })
}
