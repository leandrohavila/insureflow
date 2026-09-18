"use client"

import {
  AlertTriangle,
  FileCheck,
  FileText,
  RefreshCw,
  Shield,
} from "lucide-react"

import type { DashboardKpi } from "@/lib/data-access/modules/dashboard/hooks"

import { DashboardIconMetric } from "./dashboard-kpi-tile"
import { DashboardSection } from "./dashboard-section"
import {
  dashboardUniformCardClassName,
  formatDashboardMetricValue,
  pickDashboardKpi,
} from "./dashboard-utils"

type DashboardInsuranceIndicatorsProps = {
  kpis: DashboardKpi[]
  quotesEnabled: boolean
}

export function DashboardInsuranceIndicators({
  kpis,
  quotesEnabled,
}: DashboardInsuranceIndicatorsProps) {
  const quotesKpi = pickDashboardKpi(kpis, "quotesInProgress")
  const proposalsKpi = pickDashboardKpi(kpis, "proposalsAwaitingResponse")

  const loading =
    quotesEnabled &&
    ((quotesKpi?.isLoading ?? false) || (proposalsKpi?.isLoading ?? false))

  return (
    <DashboardSection
      title="Indicadores de Seguros"
      dense
      fill
      loading={loading}
      className={dashboardUniformCardClassName}
    >
      <div className="space-y-0.5">
        <DashboardIconMetric
          icon={FileText}
          label="Cotações"
          value={
            quotesEnabled ? formatDashboardMetricValue(quotesKpi, "0") : "—"
          }
          loading={quotesKpi?.isLoading ?? false}
        />
        <DashboardIconMetric
          icon={FileCheck}
          label="Propostas"
          value={
            quotesEnabled ? formatDashboardMetricValue(proposalsKpi, "0") : "—"
          }
          loading={proposalsKpi?.isLoading ?? false}
        />
        <DashboardIconMetric icon={Shield} label="Apólices" value="—" placeholder />
        <DashboardIconMetric icon={RefreshCw} label="Renovações" value="—" placeholder />
        <DashboardIconMetric icon={AlertTriangle} label="Sinistros" value="—" placeholder />
      </div>
    </DashboardSection>
  )
}
