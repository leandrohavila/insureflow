"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  patchListItem,
  removeListItem,
  rollbackQuery,
  snapshotQuery,
  upsertListItem,
  type OptimisticSnapshot,
} from "@/lib/data-access/optimistic"
import { queryKeys } from "@/lib/data-access/query-keys"
import { bug010LeadCreateLog } from "@/lib/performance/bug010-lead-create"
import { bug010DrawerLog } from "@/lib/performance/bug010-drawer-flow"

import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import {
  isCompleteDocumentForLookup,
  stripDocumentDigits,
} from "@/lib/documents/document"

import {
  convertLead,
  createLead,
  deleteLead,
  fetchLead,
  fetchLeadDuplicates,
  fetchLeads,
  linkLeadBusinessUnit,
  unlinkLeadBusinessUnit,
  updateLead,
} from "./api"
import type {
  ConvertLeadInput,
  CreateLeadRequestInput,
  Lead,
  LeadListFilters,
  LeadListResponse,
  UpdateLeadInput,
} from "./types"

export function useLeads(
  filters: LeadListFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.leads.list(filters),
    queryFn: () => fetchLeads(filters),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  })
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.leads.detail(id) : queryKeys.leads.details(),
    queryFn: () => fetchLead(id as string),
    enabled: Boolean(id),
  })
}

type UseLeadDuplicatesOptions = {
  document: string
  excludeId?: string
  enabled?: boolean
  debounceMs?: number
}

export function useLeadDuplicates({
  document,
  excludeId,
  enabled = true,
  debounceMs = 500,
}: UseLeadDuplicatesOptions) {
  const debouncedDocument = useDebouncedValue(document, debounceMs)
  const digits = stripDocumentDigits(debouncedDocument)
  const canLookup = enabled && isCompleteDocumentForLookup(digits)

  return useQuery({
    queryKey: queryKeys.leads.duplicates(debouncedDocument, excludeId),
    queryFn: () => fetchLeadDuplicates(debouncedDocument, excludeId),
    enabled: canLookup,
    staleTime: 30_000,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation<Lead, unknown, CreateLeadRequestInput>({
    mutationFn: async (input: CreateLeadRequestInput) => {
      bug010DrawerLog("mutationFn() start")
      try {
        const lead = await createLead(input)
        bug010DrawerLog("mutationFn() resolve")
        return lead
      } catch (error) {
        bug010DrawerLog("mutationFn() reject")
        throw error
      }
    },
    onSuccess: (lead, variables) => {
      bug010DrawerLog("onSuccess hook")
      console.log("[DRAWER] 4-onSuccess")
      const traceId =
        variables.perfTraceId ?? variables.idempotencyKey ?? "lead-create"
      bug010LeadCreateLog("mutation.onSuccess", {}, traceId)
      queryClient.setQueryData<Lead>(queryKeys.leads.detail(lead.id), lead)
      const invalidateStartedAt = performance.now()
      const queryFetches = new Map<string, number>()
      const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        const query = event.query
        if (!query) return
        const queryKey = JSON.stringify(query.queryKey)
        const isFetching = query.state.fetchStatus === "fetching"
        if (isFetching && !queryFetches.has(queryKey)) {
          queryFetches.set(queryKey, performance.now())
          bug010LeadCreateLog(`Query: ${queryKey} start`, {}, traceId)
          return
        }
        const startedAt = queryFetches.get(queryKey)
        if (!isFetching && startedAt !== undefined) {
          queryFetches.delete(queryKey)
          bug010LeadCreateLog(
            `Query: ${queryKey} end`,
            {
              queryMs: Number((performance.now() - startedAt).toFixed(2)),
              status: query.state.status,
            },
            traceId,
          )
        }
      })
      bug010LeadCreateLog(
        "invalidateQueries()",
        {
          totalSinceSubmitMs: variables.perfSubmitStartedAt
            ? Number(
                (invalidateStartedAt - variables.perfSubmitStartedAt).toFixed(
                  2,
                ),
              )
            : undefined,
        },
        traceId,
      )
      console.log("[DRAWER] 9-before-invalidate")
      bug010DrawerLog("before invalidateQueries")
      void queryClient.invalidateQueries({
        queryKey: queryKeys.commercialAgenda.all,
      })
      void queryClient
        .invalidateQueries({ queryKey: queryKeys.leads.all })
        .then(() => {
          console.log("[DRAWER] 10-after-invalidate")
          bug010DrawerLog("after invalidateQueries")
          const refreshCompletedAt = performance.now()
          bug010LeadCreateLog(
            "refetchQueries() via invalidate complete",
            {
              invalidateMs: Number(
                (refreshCompletedAt - invalidateStartedAt).toFixed(2),
              ),
              totalSinceSubmitMs: variables.perfSubmitStartedAt
                ? Number(
                    (
                      refreshCompletedAt - variables.perfSubmitStartedAt
                    ).toFixed(2),
                  )
                : undefined,
            },
            traceId,
          )
          unsubscribe()
        })
        .catch(() => {
          unsubscribe()
        })
    },
    onError: () => {
      bug010DrawerLog("onError hook")
    },
    onSettled: () => {
      bug010DrawerLog("onSettled hook")
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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.commercialAgenda.all,
      })
    },
  })
}

export function useLinkLeadBusinessUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      leadId,
      businessUnitId,
    }: {
      leadId: string
      businessUnitId: string
    }) => linkLeadBusinessUnit(leadId, businessUnitId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })
}

export function useUnlinkLeadBusinessUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      leadId,
      businessUnitId,
    }: {
      leadId: string
      businessUnitId: string
    }) => unlinkLeadBusinessUnit(leadId, businessUnitId),
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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.submissions.all,
      })
    },
  })
}
