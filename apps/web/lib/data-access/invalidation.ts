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
    businessUnits: () =>
      invalidateQuery(queryClient, queryKeys.businessUnits.all),
    communications: () =>
      invalidateQuery(queryClient, queryKeys.communications.all),
    commercialDashboard: () =>
      invalidateQuery(queryClient, queryKeys.commercialDashboard.all),
    quotes: () => invalidateQuery(queryClient, queryKeys.quotes.all),
    activities: () => invalidateQuery(queryClient, queryKeys.activities.all),
    businessUnitContext: () =>
      Promise.all([
        invalidateQuery(queryClient, queryKeys.session.current),
        invalidateQuery(queryClient, queryKeys.businessUnits.all),
        invalidateQuery(queryClient, queryKeys.leads.all),
        invalidateQuery(queryClient, queryKeys.customers.all),
        invalidateQuery(queryClient, queryKeys.clients.all),
        invalidateQuery(queryClient, queryKeys.crm.deals.all),
        invalidateQuery(queryClient, queryKeys.communications.all),
        invalidateQuery(queryClient, queryKeys.commercialDashboard.all),
        invalidateQuery(queryClient, queryKeys.leadFollowUps.all),
        invalidateQuery(queryClient, queryKeys.policyRenewals.all),
        invalidateQuery(queryClient, queryKeys.crossSell.all),
        invalidateQuery(queryClient, queryKeys.quotes.all),
        invalidateQuery(queryClient, queryKeys.activities.all),
      ]),
    users: () => invalidateQuery(queryClient, queryKeys.users.all),
    policies: () => invalidateQuery(queryClient, queryKeys.policies.all),
    claims: () => invalidateQuery(queryClient, queryKeys.claims.all),
    whatsapp: () => invalidateQuery(queryClient, queryKeys.whatsapp.all),
  }
}
