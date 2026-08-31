"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import { fetchAuditLogs, type AuditLogsQuery } from "./audit-api"
import { fetchPermissions, fetchRolesWithPermissions } from "./permissions-api"
import {
  changeUserPassword,
  createUser,
  fetchAssignableRoles,
  fetchUser,
  fetchUsers,
  setUserBusinessUnits,
  setUserRoles,
  setUserStatus,
  updateUser,
} from "./users-api"
import type { CreateUserInput, UpdateUserInput } from "./types"

function invalidateUserQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.governance.users() })
  void qc.invalidateQueries({ queryKey: queryKeys.businessUnits.memberships() })
}

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

export function useGovernanceUsers(enabled = true) {  return useQuery({
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

export function useAssignableRoles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.governance.assignableRoles(),
    queryFn: fetchAssignableRoles,
    enabled,
    retry: false,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => invalidateUserQueries(qc),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      updateUser(id, input),
    onSuccess: (_data, vars) => {
      invalidateUserQueries(qc)
      void qc.invalidateQueries({
        queryKey: queryKeys.governance.user(vars.id),
      })
    },
  })
}

export function useSetUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setUserStatus(id, isActive),
    onSuccess: () => invalidateUserQueries(qc),
  })
}

export function useChangeUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      changeUserPassword(id, password),
  })
}

export function useSetUserRoles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      setUserRoles(id, roleIds),
    onSuccess: (_data, vars) => {
      invalidateUserQueries(qc)
      void qc.invalidateQueries({
        queryKey: queryKeys.governance.user(vars.id),
      })
    },
  })
}

export function useSetUserBusinessUnits() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      businessUnitIds,
      primaryBusinessUnitId,
    }: {
      id: string
      businessUnitIds: string[]
      primaryBusinessUnitId?: string | null
    }) => setUserBusinessUnits(id, { businessUnitIds, primaryBusinessUnitId }),
    onSuccess: () => invalidateUserQueries(qc),
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
