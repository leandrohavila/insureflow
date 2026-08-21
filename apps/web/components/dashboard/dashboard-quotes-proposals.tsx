"use client"

import Link from "next/link"

import { Grid } from "@/components/design-system"
import { buttonVariants } from "@/components/ui/button"
import type { DashboardKpi } from "@/lib/data-access/modules/dashboard/hooks"
import { cn } from "@/lib/utils"

import { DashboardSection } from "./dashboard-section"
import {
  formatDashboardMetricValue,
  parseDashboardMetricNumber,
  pickDashboardKpi,
} from "./dashboard-utils"

type DashboardQuotesProposalsProps = {
  kpis: DashboardKpi[]
  canCreateQuotes?: boolean
}

type ModuleMetric = {
  key: DashboardKpi["key"]
  label: string
}

const QUOTE_METRICS: ModuleMetric[] = [
  { key: "quotesInProgress", label: "Em andamento" },
  { key: "quotesSent", label: "Enviadas" },
  { key: "proposalsAwaitingResponse", label: "Aguardando resposta" },
]

const PROPOSAL_METRICS: ModuleMetric[] = [
  { key: "proposalsAccepted", label: "Aceitas" },
  { key: "proposalsSent", label: "Enviadas" },
  { key: "proposalsRejected", label: "Recusadas" },
  { key: "proposalsExpired", label: "Expiradas" },
]

export function DashboardQuotesProposals({
  kpis,
  canCreateQuotes = false,
}: DashboardQuotesProposalsProps) {
  return (
    <Grid columns="2" className="gap-[var(--if-space-2)]">
      <ModuleCard
        title="Cotações"
        href="/cotacoes"
        metrics={QUOTE_METRICS}
        kpis={kpis}
        emptyTitle="Nenhuma cotação cadastrada."
        createLabel="Criar cotação"
        canCreate={canCreateQuotes}
      />
      <ModuleCard
        title="Propostas"
        href="/propostas"
        metrics={PROPOSAL_METRICS}
        kpis={kpis}
        emptyTitle="Nenhuma proposta cadastrada."
        createLabel="Criar proposta"
        canCreate={canCreateQuotes}
      />
    </Grid>
  )
}

function ModuleCard({
  title,
  href,
  metrics,
  kpis,
  emptyTitle,
  createLabel,
  canCreate,
}: {
  title: string
  href: string
  metrics: ModuleMetric[]
  kpis: DashboardKpi[]
  emptyTitle: string
  createLabel: string
  canCreate: boolean
}) {
  const loading = metrics.some((item) => pickDashboardKpi(kpis, item.key)?.isLoading)
  const isEmpty =
    !loading &&
    metrics.every((item) => parseDashboardMetricNumber(pickDashboardKpi(kpis, item.key)) === 0)

  return (
    <DashboardSection
      title={title}
      dense
      loading={loading}
      action={
        !isEmpty ? (
          <Link
            href={href}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-6 px-1.5 text-xs text-muted-foreground",
            )}
          >
            Ver →
          </Link>
        ) : undefined
      }
      emptyState={
        isEmpty ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{emptyTitle}</p>
            {canCreate ? (
              <Link
                href={href}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-7 px-2 text-xs",
                )}
              >
                {createLabel}
              </Link>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {!isEmpty ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
          {metrics.map((metric) => {
            const kpi = pickDashboardKpi(kpis, metric.key)
            return (
              <div key={metric.key} className="min-w-0">
                <p className="text-base font-semibold tabular-nums text-foreground">
                  {formatDashboardMetricValue(kpi, "0")}
                </p>
                <p className="text-[0.625rem] text-muted-foreground">{metric.label}</p>
              </div>
            )
          })}
        </div>
      ) : null}
    </DashboardSection>
  )
}
