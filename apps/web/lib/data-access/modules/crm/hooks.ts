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

import { createDeal, deleteDeal, fetchDeals, updateDeal, updateDealPipelinePosition } from "./api"
import { fetchCrmPipelines, fetchExecutiveDashboard, fetchSlaDashboard } from "./pipelines-api"
import {
  fetchPerformance,
  fetchPerformanceRanking,
  fetchSalesTargets,
  type PerformanceFilters,
} from "./performance-api"
import { sortDealsForPipeline } from "@/lib/pipeline-order"
import type { CrmDeal, DealPipelineUpdateInput, UpdateCrmDealInput } from "./types"

const DEALS_LIST_KEY = queryKeys.crm.deals.list()

export function useCrmDeals() {
  return useQuery({
    queryKey: DEALS_LIST_KEY,
    queryFn: fetchDeals,
  })
}

export function useCrmPipelines() {
  return useQuery({
    queryKey: queryKeys.crm.pipelines(),
    queryFn: fetchCrmPipelines,
  })
}

export function useExecutiveDashboard(
  filters: {
    from?: string
    to?: string
    businessUnitId?: string
    userId?: string
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.crm.executiveDashboard(filters),
    queryFn: () => fetchExecutiveDashboard(filters),
  })
}

export function useSlaDashboard(
  filters: {
    from?: string
    to?: string
    businessUnitId?: string
    userId?: string
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.crm.slaDashboard(filters),
    queryFn: () => fetchSlaDashboard(filters),
  })
}

export function usePerformanceDashboard(filters: PerformanceFilters = {}) {
  return useQuery({
    queryKey: queryKeys.crm.performance(filters),
    queryFn: () => fetchPerformance(filters),
  })
}

export function usePerformanceRanking(filters: PerformanceFilters = {}) {
  return useQuery({
    queryKey: queryKeys.crm.ranking(filters),
    queryFn: () => fetchPerformanceRanking(filters),
  })
}

export function useSalesTargets(filters: PerformanceFilters = {}) {
  return useQuery({
    queryKey: queryKeys.crm.salesTargets(filters),
    queryFn: () => fetchSalesTargets(filters),
  })
}

export function useCreateCrmDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDeal,
    onSuccess: (deal) => {
      queryClient.setQueryData<CrmDeal[]>(DEALS_LIST_KEY, (current) =>
        sortDealsForPipeline(upsertListItem(current, deal)),
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
        sortDealsForPipeline(
          patchListItem(current, id, input as Partial<CrmDeal>) ?? [],
        ),
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
        sortDealsForPipeline(upsertListItem(current, deal)),
      )
    },
  })
}

export function useUpdateCrmDealPipeline() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: DealPipelineUpdateInput
    }) => updateDealPipelinePosition(id, input),
    onMutate: async ({ id, input }) => {
      const snapshot = await snapshotQuery<CrmDeal[]>(
        queryClient,
        DEALS_LIST_KEY,
      )
      queryClient.setQueryData<CrmDeal[]>(DEALS_LIST_KEY, (current) =>
        sortDealsForPipeline(
          patchListItem(current, id, input as Partial<CrmDeal>) ?? [],
        ),
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
        sortDealsForPipeline(upsertListItem(current, deal)),
      )
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
