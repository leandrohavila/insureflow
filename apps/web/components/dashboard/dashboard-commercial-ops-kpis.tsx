"use client"

import {
  AlarmClock,
  ArrowRightLeft,
  Building2,
  CalendarDays,
  RefreshCw,
  Shield,
  UserPlus,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Grid, StatCard } from "@/components/design-system"
import { fetchCommercialAgenda } from "@/lib/data-access/modules/commercial-agenda/api"
import { formatCurrency, useExecutiveDashboard } from "@/lib/data-access/modules/crm"
import { queryKeys } from "@/lib/data-access/query-keys"
import {
  formatLeadConversionRate,
} from "@/lib/leads/lead-capture-metrics"
import { useLeadCaptureMetrics } from "@/lib/leads/use-lead-capture-metrics"

export function DashboardCommercialOpsKpis() {
  const capture = useLeadCaptureMetrics()
  const agendaQuery = useQuery({
    queryKey: queryKeys.commercialAgenda.list({ window: "today" }),
    queryFn: () => fetchCommercialAgenda({ window: "today" }),
  })
  const executive = useExecutiveDashboard()
  const metrics = agendaQuery.data?.metrics
  const loading =
    capture.isLoading || agendaQuery.isLoading || executive.isLoading

  return (
    <div className="space-y-[var(--if-space-4)]">
      <Grid columns="4">
        <StatCard
          icon={UserPlus}
          label="Leads hoje"
          value={metrics?.leadsToday ?? 0}
          description="Entrada comercial do dia"
          loading={loading}
        />
        <StatCard
          icon={CalendarDays}
          label="Follow-ups pendentes"
          value={metrics?.followUpsPending ?? 0}
          tone="info"
          loading={loading}
        />
        <StatCard
          icon={RefreshCw}
          label="Renovações próximas"
          value={metrics?.renewalsUpcoming ?? 0}
          tone="warning"
          loading={loading}
        />
        <StatCard
          icon={AlarmClock}
          label="Atividades atrasadas"
          value={metrics?.overdue ?? 0}
          tone="danger"
          loading={loading}
        />
      </Grid>
      <Grid columns="4">
        <StatCard
          icon={ArrowRightLeft}
          label="Conversão %"
          value={formatLeadConversionRate(capture.metrics.conversionRate)}
          description={
            capture.metrics.converted > 0
              ? `${capture.metrics.converted} convertidos`
              : "Sem conversões"
          }
          tone="success"
          loading={loading}
        />
        <StatCard
          icon={Shield}
          label="Receita Seguros"
          value={formatCurrency(executive.data?.revenueInsurance ?? 0)}
          tone="info"
          loading={loading}
        />
        <StatCard
          icon={Building2}
          label="Receita Imobiliária"
          value={formatCurrency(executive.data?.revenueRealEstate ?? 0)}
          tone="warning"
          loading={loading}
        />
      </Grid>
    </div>
  )
}
