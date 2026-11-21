"use client"

import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

import type { DashboardKpi } from "@/lib/data-access/modules/dashboard/hooks"
import { fetchCommercialAgenda } from "@/lib/data-access/modules/commercial-agenda/api"
import { formatCurrency, useExecutiveDashboard } from "@/lib/data-access/modules/crm"
import { queryKeys } from "@/lib/data-access/query-keys"
import {
  formatLeadConversionRate,
  type LeadCaptureMetrics,
} from "@/lib/leads/lead-capture-metrics"
import { cn } from "@/lib/utils"

import {
  formatDashboardMetricValue,
  pickDashboardKpi,
} from "./dashboard-utils"

type DashboardPrimaryIndicatorsProps = {
  metrics: LeadCaptureMetrics
  metricsLoading: boolean
  kpis: DashboardKpi[]
  showLeads: boolean
  showClients: boolean
  showCrm: boolean
}

type MetricTone = "default" | "info" | "warning" | "success" | "danger"

const toneClass: Record<MetricTone, string> = {
  default: "text-foreground",
  info: "text-info",
  warning: "text-warning-foreground",
  success: "text-success",
  danger: "text-destructive",
}

function MetricCell({
  label,
  value,
  loading,
  tone = "default",
  hint,
}: {
  label: string
  value: ReactNode
  loading?: boolean
  tone?: MetricTone
  hint?: string
}) {
  return (
    <div className="dashboard-metric min-w-0 rounded-xl border border-[#e4ddd2] bg-[var(--avila-ivory)]">
      <p className="truncate text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-xl font-semibold leading-none tabular-nums",
          loading ? "text-muted-foreground" : toneClass[tone],
        )}
      >
        {loading ? "—" : value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-[0.6875rem] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function MetricGroup({
  title,
  children,
  columns = "xl:grid-cols-4",
}: {
  title: string
  children: ReactNode
  columns?: string
}) {
  return (
    <section className="dashboard-metric-group min-w-0">
      <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h2>
      <div className={cn("dashboard-metric-grid grid grid-cols-1 sm:grid-cols-2", columns)}>
        {children}
      </div>
    </section>
  )
}

function RevenueCells() {
  const executive = useExecutiveDashboard()
  const loading = executive.isLoading

  return (
    <>
      <MetricCell
        label="Receita seguros"
        value={formatCurrency(executive.data?.revenueInsurance ?? 0)}
        loading={loading}
        tone="info"
      />
      <MetricCell
        label="Receita imobiliária"
        value={formatCurrency(executive.data?.revenueRealEstate ?? 0)}
        loading={loading}
        tone="warning"
      />
    </>
  )
}

export function DashboardPrimaryIndicators({
  metrics,
  metricsLoading,
  kpis,
  showLeads,
  showClients,
  showCrm,
}: DashboardPrimaryIndicatorsProps) {
  const agendaQuery = useQuery({
    queryKey: queryKeys.commercialAgenda.list({ window: "today" }),
    queryFn: () => fetchCommercialAgenda({ window: "today" }),
    enabled: showCrm,
  })
  const agendaLoading = showCrm && agendaQuery.isLoading
  const agenda = agendaQuery.data?.metrics
  const customers = pickDashboardKpi(kpis, "customers")
  const deals = pickDashboardKpi(kpis, "openDeals")
  const pending = pickDashboardKpi(kpis, "pendingActivities")

  const showRelationship = (showClients && customers) || (showCrm && deals) || showLeads
  const showOperation = showCrm
  const showResult = showLeads || showCrm

  if (!showLeads && !showRelationship && !showOperation && !showResult) return null

  return (
    <div className="dashboard-board rounded-2xl border border-[#e4ddd2] bg-[var(--avila-paper)]">
      {showLeads ? (
        <MetricGroup title="Leads">
          <MetricCell
            label="Leads totais"
            value={metrics.total}
            loading={metricsLoading}
          />
          <MetricCell
            label="Leads seguros"
            value={metrics.insurance}
            loading={metricsLoading}
            tone="info"
          />
          <MetricCell
            label="Leads imobiliários"
            value={metrics.realEstate}
            loading={metricsLoading}
            tone="warning"
          />
          <MetricCell
            label="Conversão geral"
            value={formatLeadConversionRate(metrics.conversionRate)}
            loading={metricsLoading}
            tone="success"
            hint={
              metrics.converted > 0
                ? `${metrics.converted} convertidos`
                : "Sem conversões"
            }
          />
        </MetricGroup>
      ) : null}

      {showRelationship ? (
        <MetricGroup title="Clientes e negócios">
          {showClients && customers ? (
            <MetricCell
              label="Clientes"
              value={formatDashboardMetricValue(customers, "0")}
              loading={customers.isLoading}
            />
          ) : null}
          {showLeads ? (
            <MetricCell
              label="Clientes seguros"
              value={metrics.customersInsurance}
              loading={metricsLoading}
              tone="info"
            />
          ) : null}
          {showLeads ? (
            <MetricCell
              label="Clientes imobiliários"
              value={metrics.customersRealEstate}
              loading={metricsLoading}
              tone="warning"
            />
          ) : null}
          {showCrm && deals ? (
            <MetricCell
              label="Negócios"
              value={formatDashboardMetricValue(deals, "0")}
              loading={deals.isLoading}
            />
          ) : null}
        </MetricGroup>
      ) : null}

      {showOperation ? (
        <MetricGroup title="Operação do dia" columns="xl:grid-cols-5">
          <MetricCell
            label="Follow-ups pendentes"
            value={agenda?.followUpsPending ?? 0}
            loading={agendaLoading}
            tone="info"
          />
          <MetricCell
            label="Atividades atrasadas"
            value={agenda?.overdue ?? 0}
            loading={agendaLoading}
            tone="danger"
          />
          <MetricCell
            label="Atividades pendentes"
            value={formatDashboardMetricValue(pending, "0")}
            loading={pending?.isLoading || agendaLoading}
          />
          <MetricCell
            label="Leads hoje"
            value={agenda?.leadsToday ?? 0}
            loading={agendaLoading}
            hint="Entrada comercial do dia"
          />
          <MetricCell
            label="Renovações próximas"
            value={agenda?.renewalsUpcoming ?? 0}
            loading={agendaLoading}
            tone="warning"
          />
        </MetricGroup>
      ) : null}

      {showResult ? (
        <MetricGroup title="Pipeline e receita">
          {showLeads ? (
            <MetricCell
              label="Pipeline seguros"
              value={metrics.pipelineInsurance}
              loading={metricsLoading}
              hint="Novos, em contato e qualificados"
            />
          ) : null}
          {showLeads ? (
            <MetricCell
              label="Pipeline imobiliário"
              value={metrics.pipelineRealEstate}
              loading={metricsLoading}
              hint="Novos, em atendimento e visita"
            />
          ) : null}
          {showCrm ? <RevenueCells /> : null}
        </MetricGroup>
      ) : null}
    </div>
  )
}
