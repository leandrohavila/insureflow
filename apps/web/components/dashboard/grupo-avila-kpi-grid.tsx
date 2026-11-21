"use client"

import { Building2, Filter, Shield } from "lucide-react"

import { Grid, StatCard } from "@/components/design-system"
import type { LeadCaptureMetrics } from "@/lib/leads/lead-capture-metrics"

type GrupoAvilaExecutiveKpiGridProps = {
  metrics: LeadCaptureMetrics
  loading?: boolean
}

export function GrupoAvilaExecutiveKpiGrid({
  metrics,
  loading = false,
}: GrupoAvilaExecutiveKpiGridProps) {
  return (
    <div className="space-y-[var(--if-space-2)]">
      <Grid columns="4" className="gap-3">
        <StatCard
          icon={Shield}
          label="Clientes Seguros"
          value={metrics.customersInsurance}
          tone="info"
          density="compact"
          loading={loading}
        />
        <StatCard
          icon={Building2}
          label="Clientes Imobiliários"
          value={metrics.customersRealEstate}
          tone="warning"
          density="compact"
          loading={loading}
        />
        <StatCard
          icon={Filter}
          label="Pipeline Seguros"
          value={metrics.pipelineInsurance}
          description="Novos, em contato e qualificados"
          tone="primary"
          density="compact"
          loading={loading}
        />
        <StatCard
          icon={Filter}
          label="Pipeline Imobiliário"
          value={metrics.pipelineRealEstate}
          description="Novos, em atendimento e visita"
          tone="primary"
          density="compact"
          loading={loading}
        />
      </Grid>
    </div>
  )
}
