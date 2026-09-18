"use client"

import { useMemo, useState } from "react"

import { FormSelect } from "@/components/design-system"
import {
  DashboardKpiTile,
  DashboardKpiTileGrid,
} from "@/components/dashboard/dashboard-kpi-tile"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import {
  formatCurrency,
  usePerformanceDashboard,
  usePerformanceRanking,
  useSalesTargets,
} from "@/lib/data-access/modules/crm"

const PERIODS = [
  { id: "month", label: "Mês" },
  { id: "quarter", label: "Trimestre" },
  { id: "year", label: "Ano" },
] as const

const GROUPS = [
  { id: "broker", label: "Corretor" },
  { id: "team", label: "Equipe" },
  { id: "company", label: "Empresa" },
] as const

export function PerformanceDashboardWorkspace() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("month")
  const [groupBy, setGroupBy] = useState<(typeof GROUPS)[number]["id"]>("broker")
  const [businessUnitId, setBusinessUnitId] = useState("")
  const { data: units = [] } = useBusinessUnits()
  const filters = useMemo(() => {
    const now = new Date()
    return {
      period,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      businessUnitId: businessUnitId || undefined,
      groupBy,
    }
  }, [period, businessUnitId, groupBy])
  const metricsQuery = usePerformanceDashboard(filters)
  const rankingQuery = usePerformanceRanking(filters)
  const targetsQuery = useSalesTargets(filters)
  const metrics = metricsQuery.data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-md border px-3 py-1.5 text-sm ${
              period === item.id
                ? "border-primary/40 bg-primary/12 text-primary"
                : "border-white/[0.08] text-muted-foreground"
            }`}
            onClick={() => setPeriod(item.id)}
          >
            {item.label}
          </button>
        ))}
        {GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-md border px-3 py-1.5 text-sm ${
              groupBy === item.id
                ? "border-primary/40 bg-primary/12 text-primary"
                : "border-white/[0.08] text-muted-foreground"
            }`}
            onClick={() => setGroupBy(item.id)}
          >
            {item.label}
          </button>
        ))}
        <FormSelect
          className="w-52"
          value={businessUnitId}
          onChange={(event) => setBusinessUnitId(event.target.value)}
          options={[
            { value: "", label: "Todas as empresas" },
            ...units.map((unit) => ({ value: unit.id, label: unit.name })),
          ]}
        />
      </div>

      <DashboardKpiTileGrid className="sm:grid-cols-4">
        <DashboardKpiTile
          label="Receita do mês"
          value={formatCurrency(metrics?.monthRevenue ?? 0)}
          loading={metricsQuery.isLoading}
          tone="primary"
        />
        <DashboardKpiTile
          label="Receita prevista"
          value={formatCurrency(metrics?.forecastRevenue ?? 0)}
          loading={metricsQuery.isLoading}
        />
        <DashboardKpiTile
          label="Meta atingida"
          value={`${metrics?.targetAttainment ?? 0}%`}
          loading={metricsQuery.isLoading}
          tone="success"
        />
        <DashboardKpiTile
          label="Comissão prevista"
          value={formatCurrency(metrics?.commissionForecast ?? 0)}
          loading={metricsQuery.isLoading}
        />
        <DashboardKpiTile
          label="Comissão aprovada"
          value={formatCurrency(metrics?.commissionApproved ?? 0)}
          loading={metricsQuery.isLoading}
        />
        <DashboardKpiTile
          label="Comissão paga"
          value={formatCurrency(metrics?.commissionPaid ?? 0)}
          loading={metricsQuery.isLoading}
        />
        <DashboardKpiTile
          label="Negócios ganhos"
          value={metrics?.wonDeals ?? 0}
          loading={metricsQuery.isLoading}
        />
        <DashboardKpiTile
          label="Ticket médio"
          value={formatCurrency(metrics?.avgTicket ?? 0)}
          loading={metricsQuery.isLoading}
        />
        <DashboardKpiTile
          label="Conversão"
          value={`${metrics?.conversionRate ?? 0}%`}
          loading={metricsQuery.isLoading}
        />
      </DashboardKpiTileGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.08] p-4">
          <h3 className="mb-3 text-sm font-medium">Ranking</h3>
          <ul className="space-y-2 text-sm">
            {(rankingQuery.data ?? []).map((row) => (
              <li key={row.id ?? row.name} className="flex justify-between gap-2">
                <span className="truncate">{row.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(row.revenue)} · {row.wonDeals} · {row.conversionRate}%
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/[0.08] p-4">
          <h3 className="mb-3 text-sm font-medium">Metas do período</h3>
          <ul className="space-y-2 text-sm">
            {(targetsQuery.data ?? []).map((row) => (
              <li key={row.id} className="flex justify-between gap-2">
                <span className="truncate">
                  {row.user?.name ?? row.team?.name ?? row.businessUnit?.name ?? "Empresa"}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {row.attainment}% · {formatCurrency(row.achievedRevenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
