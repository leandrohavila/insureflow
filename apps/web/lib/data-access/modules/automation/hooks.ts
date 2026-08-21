"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"
import type { CrossSellStatus } from "@/lib/business-units/constants"

import {
  createMessageTemplate,
  deleteMessageTemplate,
  fetchCrossSellMetrics,
  fetchCrossSellOpportunities,
  fetchMessageTemplates,
  fetchReactivationMetrics,
  fetchReactivationSettings,
  generateCrossSell,
  runReactivationNow,
  updateCrossSellOpportunity,
  updateMessageTemplate,
  updateReactivationSettings,
} from "./api"
import type {
  CreateMessageTemplateInput,
  LeadReactivationSettings,
} from "./types"

export function useMessageTemplates() {
  return useQuery({
    queryKey: queryKeys.messageTemplates.lists(),
    queryFn: fetchMessageTemplates,
  })
}

export function useCreateMessageTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateMessageTemplateInput) =>
      createMessageTemplate(input),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.messageTemplates.all,
      }),
  })
}

export function useUpdateMessageTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<CreateMessageTemplateInput>
    }) => updateMessageTemplate(id, input),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.messageTemplates.all,
      }),
  })
}

export function useDeleteMessageTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMessageTemplate,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.messageTemplates.all,
      }),
  })
}

export function useReactivationSettings() {
  return useQuery({
    queryKey: queryKeys.automation.reactivationSettings(),
    queryFn: fetchReactivationSettings,
  })
}

export function useUpdateReactivationSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<LeadReactivationSettings>) =>
      updateReactivationSettings(input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.automation.all }),
  })
}

export function useReactivationMetrics() {
  return useQuery({
    queryKey: queryKeys.automation.reactivationMetrics(),
    queryFn: fetchReactivationMetrics,
  })
}

export function useRunReactivation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: runReactivationNow,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.automation.all }),
  })
}

export function useCrossSellOpportunities(status?: CrossSellStatus) {
  return useQuery({
    queryKey: queryKeys.crossSell.list({ status }),
    queryFn: () => fetchCrossSellOpportunities(status),
  })
}

export function useCrossSellMetrics() {
  return useQuery({
    queryKey: queryKeys.crossSell.metrics(),
    queryFn: fetchCrossSellMetrics,
  })
}

export function useUpdateCrossSellOpportunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: { status?: CrossSellStatus; convertedRevenue?: number }
    }) => updateCrossSellOpportunity(id, input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.crossSell.all }),
  })
}

export function useGenerateCrossSell() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateCrossSell,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.crossSell.all }),
  })
}
