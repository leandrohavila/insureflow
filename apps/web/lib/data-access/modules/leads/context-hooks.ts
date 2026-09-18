"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import { fetchLeadContext } from "./context-api"

export function useLeadContext(leadId: string | null) {
  return useQuery({
    queryKey: leadId
      ? queryKeys.leads.context(leadId)
      : queryKeys.leads.contexts(),
    queryFn: () => fetchLeadContext(leadId as string),
    enabled: Boolean(leadId),
    staleTime: 30_000,
  })
}
