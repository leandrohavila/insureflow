"use client"

import type { DashboardKpi } from "@/lib/data-access/modules/dashboard/hooks"
import { cn } from "@/lib/utils"

import { DashboardSection } from "./dashboard-section"
import {
  dashboardFunnelBarClassName,
  parseDashboardMetricNumber,
  pickDashboardKpi,
} from "./dashboard-utils"

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

const FUNNEL_WIDTHS = [100, 82, 64, 46, 28]

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
  const topValue = Math.max(steps[0]?.value ?? 0, 1)

  return (
    <DashboardSection title="Funil Comercial" dense loading={loading}>
      <div className="mx-auto w-full max-w-xl space-y-1">
        {steps.map((step, index) => {
          const funnelWidth = FUNNEL_WIDTHS[index] ?? 24
          const valueWidth =
            step.placeholder || step.value === 0
              ? funnelWidth * 0.35
              : Math.round((step.value / topValue) * funnelWidth)
          const width = Math.min(funnelWidth, Math.max(12, valueWidth))

          return (
            <div
              key={step.id}
              className="grid grid-cols-[4rem_minmax(0,1fr)_1.75rem] items-center gap-2"
            >
              <p className="text-[0.6875rem] font-medium text-muted-foreground">
                {step.label}
              </p>
              <div className="flex justify-center">
                <span
                  className={cn(
                    dashboardFunnelBarClassName,
                    "block h-2.5 min-w-[2rem] rounded-sm",
                    step.placeholder && "bg-muted-foreground/20 hover:bg-muted-foreground/30",
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
              <p
                className={cn(
                  "text-right text-xs font-semibold tabular-nums",
                  step.placeholder ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {step.loading ? "—" : step.placeholder ? "—" : step.value}
              </p>
            </div>
          )
        })}
      </div>
    </DashboardSection>
  )
}
