"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  patchListItem,
  removeListItem,
  rollbackQuery,
  snapshotQuery,
  upsertListItem,
  type OptimisticSnapshot,
} from "@/lib/data-access/optimistic"
import { queryKeys } from "@/lib/data-access/query-keys"

import {
  convertLead,
  createLead,
  deleteLead,
  fetchLead,
  fetchLeads,
  updateLead,
} from "./api"
import type {
  ConvertLeadInput,
  Lead,
  LeadListFilters,
  LeadListResponse,
  UpdateLeadInput,
} from "./types"

export function useLeads(filters: LeadListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.leads.list(filters),
    queryFn: () => fetchLeads(filters),
  })
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.leads.detail(id) : queryKeys.leads.details(),
    queryFn: () => fetchLead(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLead,
    onSuccess: (lead) => {
      queryClient.setQueryData<Lead>(queryKeys.leads.detail(lead.id), lead)
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })
}

export function useUpdateLead(filters: LeadListFilters = {}) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.leads.list(filters)

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLeadInput }) =>
      updateLead(id, input),
    onMutate: async ({ id, input }) => {
      const snapshot = await snapshotQuery<LeadListResponse>(
        queryClient,
        listKey,
      )
      queryClient.setQueryData<LeadListResponse>(listKey, (current) => {
        if (!current) return current
        return {
          ...current,
          data:
            patchListItem(current.data, id, input as Partial<Lead>) ??
            current.data,
        }
      })
      return snapshot
    },
    onError: (_error, _variables, snapshot) => {
      rollbackQuery(
        queryClient,
        snapshot as OptimisticSnapshot<LeadListResponse> | undefined,
      )
    },
    onSuccess: (lead) => {
      queryClient.setQueryData<LeadListResponse>(listKey, (current) => {
        if (!current) return current
        return { ...current, data: upsertListItem(current.data, lead) }
      })
      queryClient.setQueryData<Lead>(queryKeys.leads.detail(lead.id), lead)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })
}

export function useDeleteLead(filters: LeadListFilters = {}) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.leads.list(filters)

  return useMutation({
    mutationFn: deleteLead,
    onMutate: async (id) => {
      const snapshot = await snapshotQuery<LeadListResponse>(
        queryClient,
        listKey,
      )
      queryClient.setQueryData<LeadListResponse>(listKey, (current) => {
        if (!current) return current
        return {
          ...current,
          data: removeListItem(current.data, id) ?? current.data,
          meta: { ...current.meta, total: Math.max(0, current.meta.total - 1) },
        }
      })
      return snapshot
    },
    onError: (_error, _variables, snapshot) => {
      rollbackQuery(
        queryClient,
        snapshot as OptimisticSnapshot<LeadListResponse> | undefined,
      )
    },
    onSettled: (_result, _error, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.leads.detail(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })
}

export function useConvertLead(filters: LeadListFilters = {}) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.leads.list(filters)

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: ConvertLeadInput }) =>
      convertLead(id, input ?? {}),
    onSuccess: ({ lead, deal }) => {
      queryClient.setQueryData<LeadListResponse>(listKey, (current) => {
        if (!current) return current
        return { ...current, data: upsertListItem(current.data, lead) }
      })
      queryClient.setQueryData<Lead>(queryKeys.leads.detail(lead.id), lead)
      queryClient.setQueryData(queryKeys.crm.deals.detail(deal.id), deal)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all })
    },
  })
}
