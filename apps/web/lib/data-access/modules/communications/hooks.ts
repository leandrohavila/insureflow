"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import {
  connectEvolution,
  disconnectEvolution,
  fetchCommunicationProvider,
  fetchCommunications,
  fetchCommunicationsDashboard,
  fetchEvolutionHealth,
  generateEvolutionQr,
  reconnectEvolution,
  recordCommunicationReply,
  sendCommunication,
  updateCommunicationProvider,
} from "./api"
import type {
  CommunicationDashboardFilters,
  CommunicationListFilters,
  RecordCommunicationReplyInput,
  SendCommunicationInput,
  UpdateCommunicationProviderInput,
} from "./types"

function invalidateCommunications(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.communications.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.all }),
  ])
}

export function useCommunications(filters: CommunicationListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.communications.list(filters),
    queryFn: () => fetchCommunications(filters),
  })
}

export function useCommunicationsDashboard(
  filters: CommunicationDashboardFilters = {},
) {
  return useQuery({
    queryKey: queryKeys.communications.dashboard(filters),
    queryFn: () => fetchCommunicationsDashboard(filters),
  })
}

export function useCommunicationProvider() {
  return useQuery({
    queryKey: queryKeys.communications.provider(),
    queryFn: fetchCommunicationProvider,
  })
}

export function useEvolutionHealth() {
  return useQuery({
    queryKey: queryKeys.communications.evolutionHealth(),
    queryFn: fetchEvolutionHealth,
  })
}

export function useUpdateCommunicationProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateCommunicationProviderInput) =>
      updateCommunicationProvider(input),
    onSettled: () => invalidateCommunications(queryClient),
  })
}

export function useConnectEvolution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: connectEvolution,
    onSettled: () => invalidateCommunications(queryClient),
  })
}

export function useReconnectEvolution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reconnectEvolution,
    onSettled: () => invalidateCommunications(queryClient),
  })
}

export function useDisconnectEvolution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectEvolution,
    onSettled: () => invalidateCommunications(queryClient),
  })
}

export function useGenerateEvolutionQr() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateEvolutionQr,
    onSettled: () => invalidateCommunications(queryClient),
  })
}

export function useSendCommunication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SendCommunicationInput) => sendCommunication(input),
    onSettled: () => invalidateCommunications(queryClient),
  })
}

export function useRecordCommunicationReply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: RecordCommunicationReplyInput
    }) => recordCommunicationReply(id, input),
    onSettled: () => invalidateCommunications(queryClient),
  })
}
