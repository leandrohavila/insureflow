"use client"

import { useMemo } from "react"

import type { DashboardKpi } from "@/lib/data-access/modules/dashboard/hooks"
import { useCrmDeals } from "@/lib/data-access/modules/crm"

import { DashboardKpiTile, DashboardKpiTileGrid } from "./dashboard-kpi-tile"
import { computePipelineMetrics } from "./dashboard-pipeline-metrics"
import { DashboardSection } from "./dashboard-section"
import { dashboardUniformCardClassName, pickDashboardKpi } from "./dashboard-utils"

type DashboardFinancialProductionProps = {
  kpis: DashboardKpi[]
  quotesEnabled: boolean
}

export function DashboardFinancialProduction({
  kpis,
  quotesEnabled,
}: DashboardFinancialProductionProps) {
  const dealsQuery = useCrmDeals()

  const metrics = useMemo(
    () => computePipelineMetrics(dealsQuery.data ?? []),
    [dealsQuery.data],
  )

  const quoteConversion = pickDashboardKpi(kpis, "quoteConversionRate")
  const loading =
    dealsQuery.isLoading || (quotesEnabled && (quoteConversion?.isLoading ?? false))

  const conversionValue =
    quotesEnabled &&
    quoteConversion?.value != null &&
    quoteConversion.value !== "—" &&
    !quoteConversion.isLoading
      ? String(quoteConversion.value)
      : metrics.winRateFormatted

  return (
    <DashboardSection
      title="Produção Financeira"
      dense
      fill
      loading={loading}
      className={dashboardUniformCardClassName}
    >
      <DashboardKpiTileGrid>
        <DashboardKpiTile
          label="Receita prevista"
          value={metrics.pipelineValueFormatted}
          loading={dealsQuery.isLoading}
          tone="primary"
        />
        <DashboardKpiTile label="Comissão" value="—" placeholder />
        <DashboardKpiTile
          label="Conversão"
          value={conversionValue}
          loading={loading}
        />
        <DashboardKpiTile
          label="Ticket médio"
          value={metrics.avgTicketFormatted}
          loading={dealsQuery.isLoading}
        />
        <DashboardKpiTile
          label="Ganhos"
          value={metrics.wonCount}
          loading={dealsQuery.isLoading}
          tone="success"
        />
        <DashboardKpiTile
          label="Perdidos"
          value={metrics.lostCount}
          loading={dealsQuery.isLoading}
          tone="danger"
        />
      </DashboardKpiTileGrid>
    </DashboardSection>
  )
}
