"use client"

import type { DashboardKpi } from "@/lib/data-access/modules/dashboard/hooks"
import { cn } from "@/lib/utils"

import { DashboardSection } from "./dashboard-section"
import { parseDashboardMetricNumber, pickDashboardKpi } from "./dashboard-utils"

const funnelFill = [
  "bg-[#10294B]",
  "bg-[#3d5f86]",
  "bg-[#C09048]",
  "bg-[#9a7040]",
  "bg-[#157a3c]",
]

type FunnelStep = {
  id: string
  label: string
  value: number
  loading: boolean
  placeholder?: boolean
}

type DashboardCommercialFunnelProps = {
  kpis: DashboardKpi[]
  leadsEnabled: boolean
  clientsEnabled: boolean
  quotesEnabled: boolean
}

export function DashboardCommercialFunnel({
  kpis,
  leadsEnabled,
  clientsEnabled,
  quotesEnabled,
}: DashboardCommercialFunnelProps) {
  const steps: FunnelStep[] = []

  if (leadsEnabled) {
    const kpi = pickDashboardKpi(kpis, "activeLeads")
    steps.push({
      id: "leads",
      label: "Leads",
      value: parseDashboardMetricNumber(kpi),
      loading: kpi?.isLoading ?? false,
    })
  }

  if (clientsEnabled) {
    const kpi = pickDashboardKpi(kpis, "customers")
    steps.push({
      id: "customers",
      label: "Clientes",
      value: parseDashboardMetricNumber(kpi),
      loading: kpi?.isLoading ?? false,
    })
  }

  if (quotesEnabled) {
    const quotesKpi = pickDashboardKpi(kpis, "quotesInProgress")
    steps.push({
      id: "quotes",
      label: "Cotações",
      value: parseDashboardMetricNumber(quotesKpi),
      loading: quotesKpi?.isLoading ?? false,
    })

    const proposalsKpi = pickDashboardKpi(kpis, "proposalsAwaitingResponse")
    steps.push({
      id: "proposals",
      label: "Propostas",
      value: parseDashboardMetricNumber(proposalsKpi),
      loading: proposalsKpi?.isLoading ?? false,
    })
  }

  steps.push({
    id: "policies",
    label: "Apólices",
    value: 0,
    loading: false,
    placeholder: true,
  })

  if (steps.length <= 1) return null

  const loading = steps.some((step) => step.loading)
  const topValue = Math.max(
    ...steps.filter((step) => !step.placeholder).map((step) => step.value),
    1,
  )

  return (
    <DashboardSection title="Funil Comercial" dense loading={loading}>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const share =
            step.placeholder || topValue === 0
              ? 0
              : Math.round((step.value / topValue) * 100)
          const width = step.placeholder ? 18 : Math.max(share, step.value > 0 ? 8 : 0)

          return (
            <div
              key={step.id}
              className="grid grid-cols-[5.25rem_minmax(0,1fr)_2rem_2.75rem] items-center gap-2"
            >
              <p className="text-xs font-medium text-foreground">{step.label}</p>
              <div className="h-2 overflow-hidden rounded-full bg-[#ebe5dc]">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    step.placeholder ? "bg-[#c4bbae]" : funnelFill[index] ?? "bg-[#10294B]",
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
              <p
                className={cn(
                  "text-right text-xs font-semibold tabular-nums",
                  step.placeholder || step.loading
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {step.loading || step.placeholder ? "—" : step.value}
              </p>
              <p className="text-right text-xs font-medium tabular-nums text-muted-foreground">
                {step.loading || step.placeholder ? "" : `${share}%`}
              </p>
            </div>
          )
        })}
      </div>
    </DashboardSection>
  )
}
