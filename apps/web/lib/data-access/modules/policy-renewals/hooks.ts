"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CommercialRenewalStatus } from "@/lib/business-units/constants"
import { queryKeys } from "@/lib/data-access/query-keys"

import {
  createRenewalActivity,
  createRenewalDeal,
  fetchPolicyRenewalPortfolio,
  fetchPolicyRenewals,
  updatePolicyRenewal,
  type PolicyRenewalFilters,
} from "./api"
import type { UpdatePolicyRenewalInput } from "./types"

export function usePolicyRenewals(status?: CommercialRenewalStatus) {
  return useQuery({
    queryKey: queryKeys.policyRenewals.list({ status }),
    queryFn: () => fetchPolicyRenewals(status),
  })
}

export function usePolicyRenewalPortfolio(filters: PolicyRenewalFilters) {
  return useQuery({
    queryKey: queryKeys.policyRenewals.list(filters),
    queryFn: () => fetchPolicyRenewalPortfolio(filters),
  })
}

export function useUpdatePolicyRenewal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdatePolicyRenewalInput
    }) => updatePolicyRenewal(id, input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.policyRenewals.all }),
  })
}

export function useCreateRenewalDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRenewalDeal,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.policyRenewals.all }),
  })
}

export function useCreateRenewalActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRenewalActivity,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.policyRenewals.all }),
  })
}
