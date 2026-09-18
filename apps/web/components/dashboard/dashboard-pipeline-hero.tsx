"use client"

import Link from "next/link"
import { useMemo } from "react"

import { Inline } from "@/components/design-system"
import { buttonVariants } from "@/components/ui/button"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import { cn } from "@/lib/utils"

import { computePipelineMetrics } from "./dashboard-pipeline-metrics"
import { DashboardPipelineStageBar } from "./dashboard-pipeline-stage-bar"
import { DashboardSection } from "./dashboard-section"
import { DashboardTrendIndicator } from "./dashboard-trend-indicator"
import { dashboardCardLinkClassName } from "./dashboard-utils"

type DashboardPipelineHeroProps = {
  className?: string
}

export function DashboardPipelineHero({ className }: DashboardPipelineHeroProps) {
  const dealsQuery = useCrmDeals()

  const metrics = useMemo(
    () => computePipelineMetrics(dealsQuery.data ?? []),
    [dealsQuery.data],
  )

  const loading = dealsQuery.isLoading

  return (
    <DashboardSection
      title="Pipeline Comercial"
      padding="compact"
      fill
      dense
      loading={loading}
      className={cn("border-primary/15 bg-card/80", className)}
      footer={
        <Inline justify="between" wrap className="w-full gap-1 pt-0.5">
          <Inline wrap className="gap-x-3 gap-y-0.5 text-[0.6875rem] text-muted-foreground">
            <span>
              <span className="font-semibold tabular-nums text-foreground">
                {metrics.openCount}
              </span>{" "}
              Negócios
            </span>
            <span>
              <span className="font-semibold tabular-nums text-foreground">
                {metrics.winRateFormatted}
              </span>{" "}
              Conversão
            </span>
            <span>
              Ticket Médio{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {metrics.avgTicketFormatted}
              </span>
            </span>
          </Inline>
          <Link
            href="/crm"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              dashboardCardLinkClassName,
              "h-6 px-1.5 transition-colors duration-[var(--if-duration-base)] hover:text-foreground",
            )}
          >
            Ver Pipeline →
          </Link>
        </Inline>
      }
    >
      <div className="space-y-1.5">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums md:text-3xl">
            {metrics.pipelineValueFormatted}
          </p>
          {metrics.monthlyTrend.available ? (
            <DashboardTrendIndicator
              direction={metrics.monthlyTrend.direction}
              label={metrics.monthlyTrend.label}
              className="mt-0.5"
            />
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {metrics.monthlyTrend.label}
            </p>
          )}
        </div>

        <DashboardPipelineStageBar stages={metrics.stages} loading={loading} />
      </div>
    </DashboardSection>
  )
}
