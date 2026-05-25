"use client"

import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"

import { fetchActivities } from "@/lib/data-access/modules/activities/api"
import type { Activity } from "@/lib/data-access/modules/activities"
import { queryKeys } from "@/lib/data-access/query-keys"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import { useCustomers } from "@/lib/data-access/modules/customers"
import { useLeads } from "@/lib/data-access/modules/leads"

import { safeBuildRelationshipIndex } from "./build-index"
import { normalizeIdentityValue } from "./safe"
import type { RelationshipIndex } from "./types"

const RELATIONSHIP_LEADS_LIMIT = 500
const RELATIONSHIP_CUSTOMERS_LIMIT = 500

export function useRelationshipIndex(): {
  index: RelationshipIndex
  isLoading: boolean
  isError: boolean
  isIndexError: boolean
  refetch: () => void
} {
  const dealsQuery = useCrmDeals()
  const leadsQuery = useLeads({ limit: RELATIONSHIP_LEADS_LIMIT, page: 1 })
  const customersQuery = useCustomers({
    limit: RELATIONSHIP_CUSTOMERS_LIMIT,
    page: 1,
  })

  const { index, isIndexError } = useMemo(() => {
    const deals = Array.isArray(dealsQuery.data) ? dealsQuery.data : []
    const leads = Array.isArray(leadsQuery.data?.data)
      ? leadsQuery.data.data
      : []
    const customers = Array.isArray(customersQuery.data?.data)
      ? customersQuery.data.data
      : []

    const built = safeBuildRelationshipIndex({ deals, leads, customers })
    return {
      index: built.index,
      isIndexError: built.failed,
    }
  }, [customersQuery.data?.data, dealsQuery.data, leadsQuery.data?.data])

  const hasFetchedData =
    (dealsQuery.data?.length ?? 0) > 0 ||
    (leadsQuery.data?.data?.length ?? 0) > 0 ||
    (customersQuery.data?.data?.length ?? 0) > 0

  const allQueriesFailed =
    dealsQuery.isError && leadsQuery.isError && customersQuery.isError

  return {
    index,
    isLoading:
      dealsQuery.isLoading || leadsQuery.isLoading || customersQuery.isLoading,
    isError: allQueriesFailed && !hasFetchedData,
    isIndexError,
    refetch: () => {
      void dealsQuery.refetch()
      void leadsQuery.refetch()
      void customersQuery.refetch()
    },
  }
}

type MergedTimelineInput = {
  leadIds?: string[]
  dealIds?: string[]
  enabled?: boolean
}

function safeActivityTimestamp(activity: Activity): number {
  const raw = normalizeIdentityValue(activity?.occurredAt)
  if (!raw) return 0
  const time = new Date(raw).getTime()
  return Number.isFinite(time) ? time : 0
}

export function useMergedActivityTimeline({
  leadIds = [],
  dealIds = [],
  enabled = true,
}: MergedTimelineInput) {
  const uniqueLeadIds = useMemo(
    () => Array.from(new Set((leadIds ?? []).filter(Boolean))),
    [leadIds],
  )
  const uniqueDealIds = useMemo(
    () => Array.from(new Set((dealIds ?? []).filter(Boolean))),
    [dealIds],
  )

  const queries = useQueries({
    queries: [
      ...uniqueLeadIds.map((leadId) => ({
        queryKey: queryKeys.activities.list({ leadId, limit: 50 }),
        queryFn: () => fetchActivities({ leadId, limit: 50 }),
        enabled: enabled && Boolean(leadId),
        staleTime: 30_000,
      })),
      ...uniqueDealIds.map((dealId) => ({
        queryKey: queryKeys.activities.list({ dealId, limit: 50 }),
        queryFn: () => fetchActivities({ dealId, limit: 50 }),
        enabled: enabled && Boolean(dealId),
        staleTime: 30_000,
      })),
    ],
  })

  const isLoading = queries.some((query) => query.isLoading)
  const isError = queries.some((query) => query.isError)

  const data = useMemo(() => {
    const byId = new Map<string, Activity>()
    for (const query of queries) {
      const items = Array.isArray(query.data?.data) ? query.data.data : []
      for (const activity of items) {
        if (activity?.id) byId.set(activity.id, activity)
      }
    }
    return Array.from(byId.values()).sort(
      (a, b) => safeActivityTimestamp(b) - safeActivityTimestamp(a),
    )
  }, [queries])

  const nextFollowUpAt = useMemo(() => {
    const pending = data.filter(
      (activity) => activity.status === "pending" && activity.nextFollowUpAt,
    )
    if (pending.length === 0) return null

    return pending
      .map((activity) => normalizeIdentityValue(activity.nextFollowUpAt))
      .filter(Boolean)
      .sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      )[0] ?? null
  }, [data])

  return {
    data,
    isLoading,
    isError,
    nextFollowUpAt,
    total: data.length,
  }
}
