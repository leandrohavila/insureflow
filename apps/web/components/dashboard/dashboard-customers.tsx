"use client"

import type { DashboardKpi } from "@/lib/data-access/modules/dashboard/hooks"
import { cn } from "@/lib/utils"

import { DashboardKpiTile, DashboardKpiTileGrid } from "./dashboard-kpi-tile"
import { DashboardSection } from "./dashboard-section"
import {
  dashboardUniformCardClassName,
  formatDashboardMetricValue,
  pickDashboardKpi,
} from "./dashboard-utils"

type DashboardCustomersProps = {
  kpis: DashboardKpi[]
  enabled: boolean
}

export function DashboardCustomers({ kpis, enabled }: DashboardCustomersProps) {
  if (!enabled) return null

  const activeKpi = pickDashboardKpi(kpis, "customers")
  const loading = activeKpi?.isLoading ?? false

  return (
    <DashboardSection
      title="Clientes"
      dense
      fill
      loading={loading}
      className={cn(dashboardUniformCardClassName, "dashboard-customers")}
    >
      <DashboardKpiTileGrid className="grid-cols-2 sm:grid-cols-2">
        <DashboardKpiTile
          label="Clientes ativos"
          value={formatDashboardMetricValue(activeKpi, "0")}
          loading={loading}
          tone="primary"
        />
        <DashboardKpiTile label="Sem contato" value="—" placeholder />
        <DashboardKpiTile label="Premium" value="—" placeholder />
        <DashboardKpiTile label="Aniversariantes" value="—" placeholder />
        <DashboardKpiTile
          label="Próxima renovação"
          value="—"
          placeholder
        />
      </DashboardKpiTileGrid>
    </DashboardSection>
  )
}
