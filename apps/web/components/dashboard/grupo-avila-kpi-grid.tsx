"use client"

import {
  ArrowRightLeft,
  Building2,
  Filter,
  Shield,
  Users,
} from "lucide-react"

import { Grid, StatCard } from "@/components/design-system"
import {
  formatLeadConversionRate,
  type LeadCaptureMetrics,
} from "@/lib/leads/lead-capture-metrics"

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
      <Grid columns="4">
        <StatCard
          icon={Users}
          label="Leads Totais"
          value={metrics.total}
          tone="primary"
          density="compact"
          loading={loading}
        />
        <StatCard
          icon={Shield}
          label="Leads Seguros"
          value={metrics.insurance}
          tone="info"
          density="compact"
          loading={loading}
        />
        <StatCard
          icon={Building2}
          label="Leads Imobiliários"
          value={metrics.realEstate}
          tone="warning"
          density="compact"
          loading={loading}
        />
        <StatCard
          icon={ArrowRightLeft}
          label="Conversão Geral"
          value={formatLeadConversionRate(metrics.conversionRate)}
          description={
            metrics.converted > 0
              ? `${metrics.converted} convertidos`
              : "Sem conversões"
          }
          tone="success"
          density="compact"
          loading={loading}
        />
      </Grid>
      <Grid columns="4">
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
