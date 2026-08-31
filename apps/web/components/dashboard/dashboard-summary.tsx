"use client"

import { AppCard, Grid } from "@/components/design-system"
import type { DashboardKpi } from "@/lib/data-access/modules/dashboard/hooks"
import { cn } from "@/lib/utils"

import { formatDashboardMetricValue, pickDashboardKpi } from "./dashboard-utils"

const SUMMARY_KEYS = [
  { key: "customers" as const, label: "Clientes" },
  { key: "openDeals" as const, label: "Negócios" },
  { key: "pendingActivities" as const, label: "Atividades" },
]

type DashboardSummaryProps = {
  kpis: DashboardKpi[]
}

export function DashboardSummary({ kpis }: DashboardSummaryProps) {
  const visible = SUMMARY_KEYS.map((item) => ({
    ...item,
    kpi: pickDashboardKpi(kpis, item.key),
  })).filter((item) => item.kpi)

  if (visible.length === 0) return null

  return (
    <Grid
      columns={visible.length >= 3 ? "3" : "2"}
      className="gap-[var(--if-layout-operational-metrics-gap)]"
    >
      {visible.map((item) => (
        <AppCard
          key={item.key}
          padding="compact"
          aria-busy={item.kpi?.isLoading || undefined}
          className={cn("min-w-0 border-[#C09048]/10 py-1 dark:border-white/[0.06]")}
        >
          <p className="text-[0.5625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground tabular-nums">
            {item.kpi?.isLoading
              ? "—"
              : formatDashboardMetricValue(item.kpi, "0")}
          </p>
        </AppCard>
      ))}
    </Grid>
  )
}
