"use client"

import { useState, type ComponentType } from "react"
import { ChevronDown, Percent, Target, Timer, Wallet } from "lucide-react"

import { formatCurrency, type CrmDeal } from "@/lib/data-access/modules/crm"
import { Grid, StatCard, type StatCardDensity, type StatCardTone } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CrmMetricsProps = {
  deals: CrmDeal[]
  /** `compact` — linha única densa; detalhes secundários recolhíveis. */
  density?: StatCardDensity
}

type MetricItem = {
  label: string
  value: string
  sub: string
  icon: ComponentType<{ className?: string }>
  tone: StatCardTone
}

export function CrmMetrics({ deals, density = "default" }: CrmMetricsProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const openDeals = deals.filter((deal) => deal.status === "open")
  const wonDeals = deals.filter((deal) => deal.status === "won")
  const pipelineValue = openDeals.reduce((sum, deal) => sum + deal.value, 0)
  const totalDeals = openDeals.length
  const winRate =
    deals.length === 0 ? 0 : Math.round((wonDeals.length / deals.length) * 100)
  const avgDealValue =
    openDeals.length === 0 ? 0 : pipelineValue / openDeals.length

  const metrics: MetricItem[] = [
    {
      label: "Valor pipeline",
      value: formatCurrency(pipelineValue),
      sub: "Soma dos negócios em aberto",
      icon: Wallet,
      tone: "primary",
    },
    {
      label: "Negócios",
      value: String(totalDeals),
      sub: `${deals.length} registros no banco · ${openDeals.length} em aberto`,
      icon: Target,
      tone: "info",
    },
    {
      label: "Conversão",
      value: `${winRate}%`,
      sub: `${wonDeals.length} ganhos no período total`,
      icon: Percent,
      tone: "success",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(avgDealValue),
      sub: "Média por negócio em aberto",
      icon: Timer,
      tone: "warning",
    },
  ]

  if (density === "compact") {
    return (
      <div className="flex w-full min-w-0 flex-col gap-[var(--if-layout-operational-metrics-gap)]">
        <div className="grid grid-cols-2 gap-[var(--if-layout-operational-metrics-gap)] lg:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard
              key={metric.label}
              density="compact"
              icon={metric.icon}
              label={metric.label}
              value={metric.value}
              description={metric.sub}
              tone={metric.tone}
            />
          ))}
        </div>
        <div className="flex min-w-0 items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((open) => !open)}
          >
            Detalhes
            <ChevronDown
              className={cn("size-3.5 transition-transform", detailsOpen && "rotate-180")}
              aria-hidden
            />
          </Button>
        </div>
        {detailsOpen ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {metrics.map((m) => m.sub).join(" · ")}
            {deals.some((d) => d.status === "won" || d.status === "archived")
              ? ` · ${deals.filter((d) => d.status === "won").length} ganhos · ${deals.filter((d) => d.status === "archived").length} arquivados`
              : ""}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <Grid columns="4">
      {metrics.map((metric) => (
        <StatCard
          key={metric.label}
          icon={metric.icon}
          label={metric.label}
          value={metric.value}
          description={metric.sub}
          tone={metric.tone}
        />
      ))}
    </Grid>
  )
}
