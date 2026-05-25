"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import {
  createActivity,
  deleteActivity,
  fetchActivities,
  fetchActivity,
  updateActivity,
} from "./api"
import type {
  Activity,
  ActivityListFilters,
  CreateActivityInput,
  UpdateActivityInput,
} from "./types"

type ActivityContext = {
  leadId?: string | null
  dealId?: string | null
  customerId?: string | null
}

function contextFilters(ctx: ActivityContext): ActivityListFilters {
  if (ctx.customerId) return { customerId: ctx.customerId, limit: 50 }
  if (ctx.dealId) return { dealId: ctx.dealId, limit: 50 }
  if (ctx.leadId) return { leadId: ctx.leadId, limit: 50 }
  return { limit: 50 }
}

function invalidateRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  activity: Activity,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.activities.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all })
  if (activity.leadId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.leads.detail(activity.leadId),
    })
    void queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() })
  }
  if (activity.dealId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.crm.deals.detail(activity.dealId),
    })
  }
}

export function useActivities(
  filters: ActivityListFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.activities.list(filters),
    queryFn: () => fetchActivities(filters),
    enabled,
    staleTime: 30_000,
  })
}

export function useActivityTimeline(ctx: ActivityContext) {
  const filters = contextFilters(ctx)
  const enabled = Boolean(ctx.customerId || ctx.leadId || ctx.dealId)

  return useActivities(filters, enabled)
}

export function useActivity(id: string | null) {
  return useQuery({
    queryKey: id
      ? queryKeys.activities.detail(id)
      : queryKeys.activities.details(),
    queryFn: () => fetchActivity(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateActivity(ctx: ActivityContext) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateActivityInput) => createActivity(input),
    onSuccess: (activity) => {
      invalidateRelatedQueries(queryClient, activity)
      const filters = contextFilters(ctx)
      queryClient.setQueryData(
        queryKeys.activities.list(filters),
        (
          current:
            | Awaited<ReturnType<typeof fetchActivities>>
            | undefined,
        ) => {
          if (!current) return current
          return {
            ...current,
            data: [activity, ...current.data],
          }
        },
      )
    },
  })
}

export function useUpdateActivity(ctx: ActivityContext) {
  void ctx
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateActivityInput }) =>
      updateActivity(id, input),
    onSuccess: (activity) => {
      queryClient.setQueryData(
        queryKeys.activities.detail(activity.id),
        activity,
      )
      invalidateRelatedQueries(queryClient, activity)
    },
  })
}

export function useDeleteActivity(ctx: ActivityContext) {
  void ctx
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activities.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.removeQueries({ queryKey: queryKeys.activities.detail(id) })
    },
  })
}
