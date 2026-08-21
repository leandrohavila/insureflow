"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import {
  createLeadLossReason,
  deleteLeadLossReason,
  fetchLeadLossReasons,
  updateLeadLossReason,
} from "./api"
import type {
  CreateLeadLossReasonInput,
  UpdateLeadLossReasonInput,
} from "./types"

export function useLeadLossReasons(active?: boolean) {
  return useQuery({
    queryKey: queryKeys.leadLossReasons.list({ active }),
    queryFn: () => fetchLeadLossReasons(active),
  })
}

export function useCreateLeadLossReason() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLeadLossReasonInput) =>
      createLeadLossReason(input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLossReasons.all }),
  })
}

export function useUpdateLeadLossReason() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateLeadLossReasonInput
    }) => updateLeadLossReason(id, input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLossReasons.all }),
  })
}

export function useDeleteLeadLossReason() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLeadLossReason,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLossReasons.all }),
  })
}
