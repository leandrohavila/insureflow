"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import {
  addBusinessUnitMember,
  createBusinessUnit,
  deleteBusinessUnit,
  ensureGrupoAvilaBusinessUnits,
  fetchBusinessUnitContext,
  fetchBusinessUnitMembers,
  fetchBusinessUnitMemberships,
  fetchBusinessUnits,
  removeBusinessUnitMember,
  setPrimaryBusinessUnit,
  updateBusinessUnit,
  updateBusinessUnitContext,
} from "./api"
import type {
  CreateBusinessUnitInput,
  UpdateBusinessUnitInput,
} from "./types"

function invalidateOperationalQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.session.current }),
    queryClient.invalidateQueries({ queryKey: queryKeys.businessUnits.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.clients.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.communications.all }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.commercialDashboard.all,
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.leadFollowUps.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.policyRenewals.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.crossSell.all }),
  ])
}

function invalidateMembershipQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.businessUnits.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.governance.users() }),
  ])
}

const BUSINESS_UNIT_STALE_MS = 5 * 60_000

export function useBusinessUnits() {
  return useQuery({
    queryKey: queryKeys.businessUnits.lists(),
    queryFn: fetchBusinessUnits,
    staleTime: BUSINESS_UNIT_STALE_MS,
  })
}

export function useBusinessUnitContext() {
  return useQuery({
    queryKey: queryKeys.businessUnits.context(),
    queryFn: fetchBusinessUnitContext,
    staleTime: BUSINESS_UNIT_STALE_MS,
  })
}

export function useUpdateBusinessUnitContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (businessUnitId: string | null) =>
      updateBusinessUnitContext(businessUnitId),
    onSettled: () => invalidateOperationalQueries(queryClient),
  })
}

export function useCreateBusinessUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBusinessUnitInput) => createBusinessUnit(input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.businessUnits.all }),
  })
}

export function useUpdateBusinessUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateBusinessUnitInput
    }) => updateBusinessUnit(id, input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.businessUnits.all }),
  })
}

export function useDeleteBusinessUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBusinessUnit(id),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.businessUnits.all }),
  })
}

export function useBusinessUnitMemberships(enabled = true) {
  return useQuery({
    queryKey: queryKeys.businessUnits.memberships(),
    queryFn: fetchBusinessUnitMemberships,
    enabled,
  })
}

export function useBusinessUnitMembers(businessUnitId: string | null) {
  return useQuery({
    queryKey: queryKeys.businessUnits.members(businessUnitId ?? ""),
    queryFn: () => fetchBusinessUnitMembers(businessUnitId!),
    enabled: Boolean(businessUnitId),
  })
}

export function useEnsureGrupoAvilaBusinessUnits() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ensureGrupoAvilaBusinessUnits,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.businessUnits.all }),
  })
}

export function useAddBusinessUnitMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      businessUnitId,
      userId,
      setAsPrimary,
    }: {
      businessUnitId: string
      userId: string
      setAsPrimary?: boolean
    }) => addBusinessUnitMember(businessUnitId, { userId, setAsPrimary }),
    onSettled: () => invalidateMembershipQueries(queryClient),
  })
}

export function useRemoveBusinessUnitMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      businessUnitId,
      userId,
    }: {
      businessUnitId: string
      userId: string
    }) => removeBusinessUnitMember(businessUnitId, userId),
    onSettled: () => invalidateMembershipQueries(queryClient),
  })
}

export function useSetPrimaryBusinessUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      businessUnitId,
    }: {
      userId: string
      businessUnitId: string | null
    }) => setPrimaryBusinessUnit(userId, businessUnitId),
    onSettled: () => invalidateMembershipQueries(queryClient),
  })
}
