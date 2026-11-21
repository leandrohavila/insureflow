"use client"

import { Building2, Shield, UserPlus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Grid, StatCard } from "@/components/design-system"
import { fetchCommercialAgenda } from "@/lib/data-access/modules/commercial-agenda/api"
import { formatCurrency, useExecutiveDashboard } from "@/lib/data-access/modules/crm"
import type { DashboardKpi } from "@/lib/data-access/modules/dashboard/hooks"
import { queryKeys } from "@/lib/data-access/query-keys"

import { formatDashboardMetricValue } from "./dashboard-utils"

type DashboardCommercialOpsKpisProps = {
  pendingActivities?: DashboardKpi
}

export function DashboardCommercialOpsKpis({
  pendingActivities,
}: DashboardCommercialOpsKpisProps) {
  const agendaQuery = useQuery({
    queryKey: queryKeys.commercialAgenda.list({ window: "today" }),
    queryFn: () => fetchCommercialAgenda({ window: "today" }),
  })
  const executive = useExecutiveDashboard()
  const metrics = agendaQuery.data?.metrics
  const loading = agendaQuery.isLoading || executive.isLoading

  return (
    <Grid columns="4" className="gap-3">
      <StatCard
        icon={UserPlus}
        label="Leads hoje"
        value={metrics?.leadsToday ?? 0}
        description="Entrada comercial do dia"
        density="compact"
        loading={loading}
      />
      <StatCard
        icon={UserPlus}
        label="Atividades pendentes"
        value={formatDashboardMetricValue(pendingActivities, "0")}
        density="compact"
        loading={pendingActivities?.isLoading || loading}
      />
      <StatCard
        icon={Shield}
        label="Receita Seguros"
        value={formatCurrency(executive.data?.revenueInsurance ?? 0)}
        tone="info"
        density="compact"
        loading={loading}
      />
      <StatCard
        icon={Building2}
        label="Receita Imobiliária"
        value={formatCurrency(executive.data?.revenueRealEstate ?? 0)}
        tone="warning"
        density="compact"
        loading={loading}
      />
    </Grid>
  )
}
