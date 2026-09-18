"use client"

import { useMemo, useState } from "react"

import { FormSelect } from "@/components/design-system"
import {
  DashboardKpiTile,
  DashboardKpiTileGrid,
} from "@/components/dashboard/dashboard-kpi-tile"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import { formatCurrency, useExecutiveDashboard } from "@/lib/data-access/modules/crm"
import { stageLabelMap } from "@/lib/data-access/modules/crm"

const PERIODS = [
  { id: "30", label: "30 dias" },
  { id: "90", label: "90 dias" },
  { id: "7", label: "7 dias" },
] as const

function periodRange(days: string) {
  const to = new Date()
  const from = new Date(to.getTime() - Number(days) * 86_400_000)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function ExecutiveDashboardWorkspace() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("30")
  const [businessUnitId, setBusinessUnitId] = useState("")
  const { data: units = [] } = useBusinessUnits()
  const range = useMemo(() => periodRange(period), [period])
  const query = useExecutiveDashboard({
    ...range,
    businessUnitId: businessUnitId || undefined,
  })
  const metrics = query.data
  const funnelMax = Math.max(1, ...(metrics?.funnel.map((item) => item.count) ?? [1]))

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
        <DashboardKpiTile label="Leads" value={metrics?.leads ?? 0} loading={query.isLoading} />
        <DashboardKpiTile
          label="Oportunidades"
          value={metrics?.opportunities ?? 0}
          loading={query.isLoading}
        />
        <DashboardKpiTile label="Deals abertos" value={metrics?.deals ?? 0} loading={query.isLoading} />
        <DashboardKpiTile
          label="Conversão"
          value={`${metrics?.conversionRate ?? 0}%`}
          loading={query.isLoading}
          tone="success"
        />
        <DashboardKpiTile
          label="Receita"
          value={formatCurrency(metrics?.revenue ?? 0)}
          loading={query.isLoading}
          tone="primary"
        />
        <DashboardKpiTile label="Renovações" value={metrics?.renewals ?? 0} loading={query.isLoading} />
        <DashboardKpiTile label="Cross-sell" value={metrics?.crossSell ?? 0} loading={query.isLoading} />
        <DashboardKpiTile
          label="Tempo médio de fechamento"
          value={`${metrics?.avgCloseDays ?? 0}d`}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Receita Corretora"
          value={formatCurrency(metrics?.revenueInsurance ?? 0)}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Receita Imobiliária"
          value={formatCurrency(metrics?.revenueRealEstate ?? 0)}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Meta consolidada"
          value={formatCurrency(metrics?.consolidatedTarget ?? 0)}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Comissões previstas"
          value={formatCurrency(metrics?.commissionsForecast ?? 0)}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Comissões pagas"
          value={formatCurrency(metrics?.commissionsPaid ?? 0)}
          loading={query.isLoading}
          tone="success"
        />
      </DashboardKpiTileGrid>

      <section>
        <h3 className="mb-3 text-sm font-medium">Funil visual</h3>
        <div className="space-y-2">
          {(metrics?.funnel ?? []).map((item) => (
            <div key={item.stage} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-2">
              <span className="truncate text-xs text-muted-foreground">
                {stageLabelMap[item.stage] ?? item.stage}
              </span>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${Math.round((item.count / funnelMax) * 100)}%` }}
                />
              </div>
              <span className="text-right text-xs tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.08] p-4">
          <h3 className="mb-3 text-sm font-medium">Taxa por corretor</h3>
          <ul className="space-y-2 text-sm">
            {(metrics?.byBroker ?? []).map((row) => (
              <li key={row.userId ?? row.name} className="flex justify-between gap-2">
                <span className="truncate">{row.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {row.conversionRate}% · {formatCurrency(row.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/[0.08] p-4">
          <h3 className="mb-3 text-sm font-medium">Taxa por empresa</h3>
          <ul className="space-y-2 text-sm">
            {(metrics?.byCompany ?? []).map((row) => (
              <li key={row.businessUnitId ?? row.name} className="flex justify-between gap-2">
                <span className="truncate">{row.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {row.conversionRate}% · {formatCurrency(row.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-white/[0.08] p-4">
          <h3 className="mb-3 text-sm font-medium">Top corretores</h3>
          <ul className="space-y-2 text-sm">
            {(metrics?.topBrokers ?? []).map((row) => (
              <li key={row.userId ?? row.name} className="flex justify-between gap-2">
                <span className="truncate">{row.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(row.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/[0.08] p-4">
          <h3 className="mb-3 text-sm font-medium">Top produtos</h3>
          <ul className="space-y-2 text-sm">
            {(metrics?.topProducts ?? []).map((row) => (
              <li key={row.productType} className="flex justify-between gap-2">
                <span className="truncate">{row.productType}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(row.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/[0.08] p-4">
          <h3 className="mb-3 text-sm font-medium">Top fontes de leads</h3>
          <ul className="space-y-2 text-sm">
            {(metrics?.topLeadSources ?? []).map((row) => (
              <li key={row.sourceType} className="flex justify-between gap-2">
                <span className="truncate">{row.sourceType}</span>
                <span className="tabular-nums text-muted-foreground">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
