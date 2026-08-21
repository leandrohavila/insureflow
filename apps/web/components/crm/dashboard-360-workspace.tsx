"use client"

import { useMemo, useState } from "react"

import { FormSelect } from "@/components/design-system"
import {
  DashboardKpiTile,
  DashboardKpiTileGrid,
} from "@/components/dashboard/dashboard-kpi-tile"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import { useDashboard360 } from "@/lib/data-access/modules/customer-360"
import { formatCurrency } from "@/lib/data-access/modules/crm"

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

export function Dashboard360Workspace() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("30")
  const [businessUnitId, setBusinessUnitId] = useState("")
  const [userId, setUserId] = useState("")
  const { data: units = [] } = useBusinessUnits()
  const range = useMemo(() => periodRange(period), [period])
  const query = useDashboard360({
    ...range,
    businessUnitId: businessUnitId || undefined,
    userId: userId || undefined,
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
            { value: "", label: "Todas as empresas" },
            ...units.map((unit) => ({ value: unit.id, label: unit.name })),
          ]}
        />
        <FormSelect
          className="w-52"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          options={[
            { value: "", label: "Todos os corretores" },
            ...(metrics?.brokers ?? []).map((user) => ({
              value: user.id,
              label: user.name,
            })),
          ]}
        />
      </div>

      <DashboardKpiTileGrid className="sm:grid-cols-4">
        <DashboardKpiTile
          label="Clientes ativos"
          value={metrics?.activeCustomers ?? 0}
          loading={query.isLoading}
          tone="success"
        />
        <DashboardKpiTile
          label="Clientes inativos"
          value={metrics?.inactiveCustomers ?? 0}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Clientes reativados"
          value={metrics?.reactivatedCustomers ?? 0}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Receita prevista"
          value={formatCurrency(metrics?.predictedRevenue ?? 0)}
          loading={query.isLoading}
          tone="primary"
        />
        <DashboardKpiTile
          label="Receita renovação"
          value={formatCurrency(metrics?.renewalRevenue ?? 0)}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Receita cross-sell"
          value={formatCurrency(metrics?.crossSellRevenue ?? 0)}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Oportunidades abertas"
          value={metrics?.openOpportunities ?? 0}
          loading={query.isLoading}
        />
        <DashboardKpiTile
          label="Taxa de conversão"
          value={`${metrics?.conversionRate ?? 0}%`}
          loading={query.isLoading}
          tone="success"
        />
      </DashboardKpiTileGrid>
    </div>
  )
}
