"use client"

import { useQueries, useQuery } from "@tanstack/react-query"
import { hasPermission, type SessionPayload } from "@repo/auth"

import { startOfToday } from "@/components/crm/task-workspace/task-workspace-utils"
import { fetchActivities } from "@/lib/data-access/modules/activities/api"
import { fetchDeals } from "@/lib/data-access/modules/crm/api"
import { fetchCustomers } from "@/lib/data-access/modules/customers/api"
import { fetchLeads } from "@/lib/data-access/modules/leads/api"
import type { LeadStatus } from "@/lib/data-access/modules/leads"
import { fetchQuoteMetrics } from "@/lib/data-access/modules/quotes/api"
import { queryKeys } from "@/lib/data-access/query-keys"
import { bug010LeadCreateLog } from "@/lib/performance/bug010-lead-create"

const ACTIVE_LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified"]

async function bug010DashboardQuery<T>(
  label: string,
  queryFn: () => Promise<T>,
): Promise<T> {
  const startedAt = performance.now()
  bug010LeadCreateLog(`Query: ${label} start`)
  const result = await queryFn()
  bug010LeadCreateLog(`Query: ${label} end`, {
    queryMs: Number((performance.now() - startedAt).toFixed(2)),
  })
  return result
}

export type DashboardKpiKey =
  | "activeLeads"
  | "customers"
  | "openDeals"
  | "pendingActivities"
  | "overdueActivities"
  | "quotesInProgress"
  | "quotesSent"
  | "proposalsAccepted"
  | "proposalsRejected"
  | "proposalsSent"
  | "proposalsViewed"
  | "proposalsExpired"
  | "proposalsAwaitingResponse"
  | "averageQuoteDuration"
  | "quoteConversionRate"

export type DashboardKpi = {
  key: DashboardKpiKey
  label: string
  value: number | string | null
  isLoading: boolean
  isError: boolean
}

function overdueFollowUpBeforeIso() {
  const start = startOfToday()
  start.setMilliseconds(start.getMilliseconds() - 1)
  return start.toISOString()
}

export function useDashboardKpis(session: SessionPayload | null | undefined) {
  const canLeads = hasPermission(session, "leads:view")
  const canClients = hasPermission(session, "clients:view")
  const canCrm = hasPermission(session, "crm:view")
  const canQuotes = hasPermission(session, "quotes:view")

  const activeLeadQueries = useQueries({
    queries: ACTIVE_LEAD_STATUSES.map((status) => ({
      queryKey: queryKeys.leads.list({ status, limit: 1 }),
      queryFn: () =>
        bug010DashboardQuery(`dashboard leads ${status}`, () =>
          fetchLeads({ status, limit: 1 }),
        ),
      enabled: canLeads && Boolean(session),
    })),
  })

  const customersQuery = useQuery({
    queryKey: queryKeys.customers.list({ limit: 1 }),
    queryFn: () =>
      bug010DashboardQuery("dashboard customers", () =>
        fetchCustomers({ limit: 1 }),
      ),
    enabled: canClients && Boolean(session),
  })

  const dealsQuery = useQuery({
    queryKey: queryKeys.crm.deals.list(),
    queryFn: () => bug010DashboardQuery("dashboard deals", fetchDeals),
    enabled: canCrm && Boolean(session),
  })

  const pendingActivitiesQuery = useQuery({
    queryKey: queryKeys.activities.list({ status: "pending", limit: 1 }),
    queryFn: () =>
      bug010DashboardQuery("dashboard pending activities", () =>
        fetchActivities({ status: "pending", limit: 1 }),
      ),
    enabled: canCrm && Boolean(session),
  })

  const overdueActivitiesQuery = useQuery({
    queryKey: queryKeys.activities.list({
      status: "pending",
      nextFollowUpTo: overdueFollowUpBeforeIso(),
      limit: 1,
    }),
    queryFn: () =>
      bug010DashboardQuery("dashboard overdue activities", () =>
        fetchActivities({
          status: "pending",
          nextFollowUpTo: overdueFollowUpBeforeIso(),
          limit: 1,
        }),
      ),
    enabled: canCrm && Boolean(session),
  })

  const quoteMetricsQuery = useQuery({
    queryKey: queryKeys.quotes.metrics(),
    queryFn: () =>
      bug010DashboardQuery("dashboard quote metrics", fetchQuoteMetrics),
    enabled: canQuotes && Boolean(session),
  })

  const openDeals =
    dealsQuery.data?.filter((deal) => deal.status === "open").length ?? null

  const activeLeads = canLeads
    ? activeLeadQueries.reduce(
        (sum, query) => sum + (query.data?.meta.total ?? 0),
        0,
      )
    : null

  const activeLeadsLoading = activeLeadQueries.some((query) => query.isLoading)
  const activeLeadsError = activeLeadQueries.some((query) => query.isError)

  const kpis: DashboardKpi[] = []

  if (canLeads) {
    kpis.push({
      key: "activeLeads",
      label: "Leads ativos",
      value: activeLeadsLoading ? null : activeLeads,
      isLoading: activeLeadsLoading,
      isError: activeLeadsError,
    })
  }

  if (canClients) {
    kpis.push({
      key: "customers",
      label: "Clientes",
      value: customersQuery.isLoading
        ? null
        : (customersQuery.data?.meta.total ?? 0),
      isLoading: customersQuery.isLoading,
      isError: customersQuery.isError,
    })
  }

  if (canCrm) {
    kpis.push(
      {
        key: "openDeals",
        label: "Negócios em aberto",
        value: dealsQuery.isLoading ? null : (openDeals ?? 0),
        isLoading: dealsQuery.isLoading,
        isError: dealsQuery.isError,
      },
      {
        key: "pendingActivities",
        label: "Atividades pendentes",
        value: pendingActivitiesQuery.isLoading
          ? null
          : (pendingActivitiesQuery.data?.meta.total ?? 0),
        isLoading: pendingActivitiesQuery.isLoading,
        isError: pendingActivitiesQuery.isError,
      },
      {
        key: "overdueActivities",
        label: "Atividades vencidas",
        value: overdueActivitiesQuery.isLoading
          ? null
          : (overdueActivitiesQuery.data?.meta.total ?? 0),
        isLoading: overdueActivitiesQuery.isLoading,
        isError: overdueActivitiesQuery.isError,
      },
    )
  }

  if (canQuotes) {
    kpis.push(
      {
        key: "quotesInProgress",
        label: "Cotações em andamento",
        value: quoteMetricsQuery.isLoading
          ? null
          : (quoteMetricsQuery.data?.pendingAnalysis ?? 0),
        isLoading: quoteMetricsQuery.isLoading,
        isError: quoteMetricsQuery.isError,
      },
      {
        key: "quotesSent",
        label: "Cotações enviadas",
        value: quoteMetricsQuery.isLoading
          ? null
          : (quoteMetricsQuery.data?.sent ?? 0),
        isLoading: quoteMetricsQuery.isLoading,
        isError: quoteMetricsQuery.isError,
      },
      {
        key: "proposalsAccepted",
        label: "Propostas aceitas",
        value: quoteMetricsQuery.isLoading
          ? null
          : (quoteMetricsQuery.data?.acceptedProposals ?? 0),
        isLoading: quoteMetricsQuery.isLoading,
        isError: quoteMetricsQuery.isError,
      },
      {
        key: "proposalsRejected",
        label: "Propostas recusadas",
        value: quoteMetricsQuery.isLoading
          ? null
          : (quoteMetricsQuery.data?.rejectedProposals ?? 0),
        isLoading: quoteMetricsQuery.isLoading,
        isError: quoteMetricsQuery.isError,
      },
      {
        key: "proposalsSent",
        label: "Propostas enviadas",
        value: quoteMetricsQuery.isLoading
          ? null
          : (quoteMetricsQuery.data?.sentProposals ?? 0),
        isLoading: quoteMetricsQuery.isLoading,
        isError: quoteMetricsQuery.isError,
      },
      {
        key: "proposalsViewed",
        label: "Propostas visualizadas",
        value: quoteMetricsQuery.isLoading
          ? null
          : (quoteMetricsQuery.data?.viewedProposals ?? 0),
        isLoading: quoteMetricsQuery.isLoading,
        isError: quoteMetricsQuery.isError,
      },
      {
        key: "proposalsExpired",
        label: "Propostas expiradas",
        value: quoteMetricsQuery.isLoading
          ? null
          : (quoteMetricsQuery.data?.expiredProposals ?? 0),
        isLoading: quoteMetricsQuery.isLoading,
        isError: quoteMetricsQuery.isError,
      },
      {
        key: "proposalsAwaitingResponse",
        label: "Aguardando resposta",
        value: quoteMetricsQuery.isLoading
          ? null
          : (quoteMetricsQuery.data?.proposalsAwaitingResponse ?? 0),
        isLoading: quoteMetricsQuery.isLoading,
        isError: quoteMetricsQuery.isError,
      },
      {
        key: "averageQuoteDuration",
        label: "Tempo médio de cotação",
        value: quoteMetricsQuery.isLoading
          ? null
          : quoteMetricsQuery.data?.averageQuoteDurationHours != null
            ? `${quoteMetricsQuery.data.averageQuoteDurationHours}h`
            : "—",
        isLoading: quoteMetricsQuery.isLoading,
        isError: quoteMetricsQuery.isError,
      },
      {
        key: "quoteConversionRate",
        label: "Conversão de cotações",
        value: quoteMetricsQuery.isLoading
          ? null
          : quoteMetricsQuery.data?.quoteConversionRate != null
            ? `${quoteMetricsQuery.data.quoteConversionRate}%`
            : "—",
        isLoading: quoteMetricsQuery.isLoading,
        isError: quoteMetricsQuery.isError,
      },
    )
  }

  const isLoading = kpis.some((kpi) => kpi.isLoading)
  const isError = kpis.some((kpi) => kpi.isError)

  return { kpis, isLoading, isError }
}
