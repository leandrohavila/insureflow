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

type LeadCaptureMetricsGridProps = {
  metrics: LeadCaptureMetrics
  loading?: boolean
}

export function LeadCaptureMetricsGrid({
  metrics,
  loading = false,
}: LeadCaptureMetricsGridProps) {
  return (
    <Grid columns="5">
      <StatCard
        icon={Users}
        label="Leads Totais"
        value={metrics.total}
        tone="primary"
        loading={loading}
      />
      <StatCard
        icon={Shield}
        label="Leads Seguros"
        value={metrics.insurance}
        tone="info"
        loading={loading}
      />
      <StatCard
        icon={Building2}
        label="Leads Imobiliários"
        value={metrics.realEstate}
        tone="warning"
        loading={loading}
      />
      <StatCard
        icon={ArrowRightLeft}
        label="Conversão"
        value={formatLeadConversionRate(metrics.conversionRate)}
        description={
          metrics.converted > 0
            ? `${metrics.converted} convertidos`
            : "Sem conversões"
        }
        tone="success"
        loading={loading}
      />
      <StatCard
        icon={Filter}
        label="Pipeline"
        value={metrics.pipeline}
        description="Novos, em contato e qualificados"
        tone="primary"
        loading={loading}
      />
    </Grid>
  )
}
