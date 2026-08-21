"use client"

import { useState } from "react"

import { FormSelect } from "@/components/design-system"
import {
  DashboardKpiTile,
  DashboardKpiTileGrid,
} from "@/components/dashboard/dashboard-kpi-tile"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import { useSlaDashboard } from "@/lib/data-access/modules/crm"

export function SlaDashboardWorkspace() {
  const [businessUnitId, setBusinessUnitId] = useState("")
  const { data: units = [] } = useBusinessUnits()
  const query = useSlaDashboard({
    businessUnitId: businessUnitId || undefined,
  })
  const metrics = query.data

  return (
    <div className="space-y-6">
      <FormSelect
        className="w-52"
        value={businessUnitId}
        onChange={(event) => setBusinessUnitId(event.target.value)}
        options={[
          { value: "", label: "Todas as empresas" },
          ...units.map((unit) => ({ value: unit.id, label: unit.name })),
        ]}
      />

      <DashboardKpiTileGrid className="sm:grid-cols-4">
        <DashboardKpiTile
          label="Em SLA"
          value={metrics?.inSla ?? 0}
          loading={query.isLoading}
          tone="success"
        />
        <DashboardKpiTile
          label="Em alerta"
          value={metrics?.warning ?? 0}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Atrasados"
          value={metrics?.overdue ?? 0}
          loading={query.isLoading}
          tone="danger"
        />
        <DashboardKpiTile
          label="Negócios abertos"
          value={metrics?.openDeals ?? 0}
          loading={query.isLoading}
        />
      </DashboardKpiTileGrid>

      <section>
        <h3 className="mb-3 text-sm font-medium">Tempo médio por estágio</h3>
        <ul className="space-y-2 text-sm">
          {(metrics?.avgHoursByStage ?? []).map((row) => (
            <li key={row.stage} className="flex justify-between gap-2">
              <span className="truncate text-muted-foreground">{row.label}</span>
              <span className="tabular-nums">{row.avgHours}h</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.08] p-4">
          <h3 className="mb-3 text-sm font-medium">Ranking por corretor</h3>
          <ul className="space-y-2 text-sm">
            {(metrics?.byBroker ?? []).map((row) => (
              <li key={row.userId ?? row.name} className="flex justify-between gap-2">
                <span className="truncate">{row.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {row.overdue} atrasos · {row.warning} alertas
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/[0.08] p-4">
          <h3 className="mb-3 text-sm font-medium">Ranking por empresa</h3>
          <ul className="space-y-2 text-sm">
            {(metrics?.byCompany ?? []).map((row) => (
              <li
                key={row.businessUnitId ?? row.name}
                className="flex justify-between gap-2"
              >
                <span className="truncate">{row.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {row.overdue} atrasos · {row.warning} alertas
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
