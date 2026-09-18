"use client"

import { useMemo, useState } from "react"

import { FormSelect } from "@/components/design-system"
import { DashboardKpiTile, DashboardKpiTileGrid } from "@/components/dashboard/dashboard-kpi-tile"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import { useCommercialDashboard } from "@/lib/data-access/modules/commercial-dashboard"

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

export function CommercialDashboardWorkspace() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("30")
  const [businessUnitId, setBusinessUnitId] = useState("")
  const { data: units = [] } = useBusinessUnits()
  const range = useMemo(() => periodRange(period), [period])
  const query = useCommercialDashboard({
    ...range,
    businessUnitId: businessUnitId || undefined,
  })
  const metrics = query.data

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
            { value: "", label: "Todas as unidades" },
            ...units.map((unit) => ({ value: unit.id, label: unit.name })),
          ]}
        />
      </div>

      <DashboardKpiTileGrid className="sm:grid-cols-4">
        <DashboardKpiTile
          label="Leads perdidos"
          value={metrics?.lostLeads ?? 0}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Leads reativados"
          value={metrics?.reactivatedLeads ?? 0}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Taxa de recuperação"
          value={`${metrics?.recoveryRate ?? 0}%`}
          loading={query.isLoading}
          tone="success"
        />
        <DashboardKpiTile
          label="Receita recuperada"
          value={formatBRL(metrics?.recoveredRevenue ?? 0)}
          loading={query.isLoading}
          tone="primary"
        />
        <DashboardKpiTile
          label="Follow-ups pendentes"
          value={metrics?.pendingFollowUps ?? 0}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Follow-ups atrasados"
          value={metrics?.overdueFollowUps ?? 0}
          loading={query.isLoading}
          tone="danger"
        />
        <DashboardKpiTile
          label="Renovações próximas"
          value={metrics?.upcomingRenewals ?? 0}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Renovações convertidas"
          value={metrics?.convertedRenewals ?? 0}
          loading={query.isLoading}
          tone="success"
        />
      </DashboardKpiTileGrid>
    </div>
  )
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}
