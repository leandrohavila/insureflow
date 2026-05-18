"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"
import {
  patchListItem,
  removeListItem,
  rollbackQuery,
  snapshotQuery,
  upsertListItem,
  type OptimisticSnapshot,
} from "@/lib/data-access/optimistic"

import { createDeal, deleteDeal, fetchDeals, updateDeal } from "./api"
import type { CrmDeal, UpdateCrmDealInput } from "./types"

const DEALS_LIST_KEY = queryKeys.crm.deals.list()

export function useCrmDeals() {
  return useQuery({
    queryKey: DEALS_LIST_KEY,
    queryFn: fetchDeals,
  })
}

export function useCreateCrmDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDeal,
    onSuccess: (deal) => {
      queryClient.setQueryData<CrmDeal[]>(DEALS_LIST_KEY, (current) =>
        upsertListItem(current, deal),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all })
    },
  })
}

export function useUpdateCrmDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCrmDealInput }) =>
      updateDeal(id, input),
    onMutate: async ({ id, input }) => {
      const snapshot = await snapshotQuery<CrmDeal[]>(
        queryClient,
        DEALS_LIST_KEY,
      )
      queryClient.setQueryData<CrmDeal[]>(DEALS_LIST_KEY, (current) =>
        patchListItem(current, id, input as Partial<CrmDeal>),
      )
      return snapshot
    },
    onError: (_error, _variables, snapshot) => {
      rollbackQuery(
        queryClient,
        snapshot as OptimisticSnapshot<CrmDeal[]> | undefined,
      )
    },
    onSuccess: (deal) => {
      queryClient.setQueryData<CrmDeal[]>(DEALS_LIST_KEY, (current) =>
        upsertListItem(current, deal),
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all })
    },
  })
}

export function useDeleteCrmDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDeal,
    onMutate: async (id) => {
      const snapshot = await snapshotQuery<CrmDeal[]>(
        queryClient,
        DEALS_LIST_KEY,
      )
      queryClient.setQueryData<CrmDeal[]>(DEALS_LIST_KEY, (current) =>
        removeListItem(current, id),
      )
      return snapshot
    },
    onError: (_error, _variables, snapshot) => {
      rollbackQuery(
        queryClient,
        snapshot as OptimisticSnapshot<CrmDeal[]> | undefined,
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all })
    },
  })
}
