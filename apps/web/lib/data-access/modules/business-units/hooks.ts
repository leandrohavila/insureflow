"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import {
  createBusinessUnit,
  deleteBusinessUnit,
  fetchBusinessUnitContext,
  fetchBusinessUnits,
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

export function useBusinessUnits() {
  return useQuery({
    queryKey: queryKeys.businessUnits.lists(),
    queryFn: fetchBusinessUnits,
  })
}

export function useBusinessUnitContext() {
  return useQuery({
    queryKey: queryKeys.businessUnits.context(),
    queryFn: fetchBusinessUnitContext,
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
