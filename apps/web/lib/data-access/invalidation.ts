"use client"

import { useQueryClient, type QueryKey } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

export function invalidateQuery(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: QueryKey,
) {
  return queryClient.invalidateQueries({ queryKey })
}

export function useAppInvalidation() {
  const queryClient = useQueryClient()

  return {
    query: (queryKey: QueryKey) => invalidateQuery(queryClient, queryKey),
    module: (queryKey: QueryKey) => invalidateQuery(queryClient, queryKey),
    crmDeals: () => invalidateQuery(queryClient, queryKeys.crm.deals.all),
    customers: () => invalidateQuery(queryClient, queryKeys.customers.all),
    clients: () => invalidateQuery(queryClient, queryKeys.clients.all),
    leads: () => invalidateQuery(queryClient, queryKeys.leads.all),
    companies: () => invalidateQuery(queryClient, queryKeys.companies.all),
    users: () => invalidateQuery(queryClient, queryKeys.users.all),
    policies: () => invalidateQuery(queryClient, queryKeys.policies.all),
    claims: () => invalidateQuery(queryClient, queryKeys.claims.all),
    whatsapp: () => invalidateQuery(queryClient, queryKeys.whatsapp.all),
  }
}
