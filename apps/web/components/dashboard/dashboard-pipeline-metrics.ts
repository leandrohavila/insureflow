import { formatCurrency, pipelineStages } from "@/lib/data-access/modules/crm"
import type { CrmDeal } from "@/lib/data-access/modules/crm"

import type { TrendDirection } from "./dashboard-trend-indicator"

export type PipelineStageMetric = {
  id: (typeof pipelineStages)[number]["id"]
  label: string
  count: number
  share: number
}

export type PipelineTrendMetric = {
  direction: TrendDirection
  percent: number | null
  label: string
  available: boolean
}

export type PipelineMetrics = {
  pipelineValue: number
  pipelineValueFormatted: string
  openCount: number
  wonCount: number
  lostCount: number
  wonValue: number
  wonValueFormatted: string
  winRate: number
  winRateFormatted: string
  avgTicket: number
  avgTicketFormatted: string
  stages: PipelineStageMetric[]
  monthlyTrend: PipelineTrendMetric
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function sumDealValue(deals: CrmDeal[]) {
  return deals.reduce((sum, deal) => sum + deal.value, 0)
}

function buildTrend(
  currentValue: number,
  previousValue: number,
  periodLabel: string,
): PipelineTrendMetric {
  if (currentValue === 0 && previousValue === 0) {
    return {
      direction: "neutral",
      percent: null,
      label: `Histórico ${periodLabel} em breve`,
      available: false,
    }
  }

  if (previousValue === 0) {
    return {
      direction: "up",
      percent: 100,
      label: `+100% em relação ${periodLabel}`,
      available: true,
    }
  }

  const delta = Math.round(((currentValue - previousValue) / previousValue) * 100)
  const direction: TrendDirection =
    delta > 0 ? "up" : delta < 0 ? "down" : "neutral"

  return {
    direction,
    percent: Math.abs(delta),
    label: `${delta >= 0 ? "+" : ""}${delta}% em relação ${periodLabel}`,
    available: true,
  }
}

export function computePipelineMetrics(deals: CrmDeal[]): PipelineMetrics {
  const now = new Date()
  const openDeals = deals.filter((deal) => deal.status === "open")
  const wonDeals = deals.filter((deal) => deal.status === "won")
  const lostDeals = deals.filter((deal) => deal.status === "lost")
  const pipelineValue = sumDealValue(openDeals)
  const wonValue = sumDealValue(wonDeals)
  const winRate =
    deals.length === 0 ? 0 : Math.round((wonDeals.length / deals.length) * 100)
  const avgTicket =
    openDeals.length === 0 ? 0 : Math.round(pipelineValue / openDeals.length)

  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  )
  const lastMonthEnd = new Date(thisMonthStart.getTime() - 1)

  const thisMonthOpenValue = sumDealValue(
    openDeals.filter((deal) => new Date(deal.createdAt) >= thisMonthStart),
  )
  const lastMonthOpenValue = sumDealValue(
    openDeals.filter((deal) => {
      const createdAt = new Date(deal.createdAt)
      return createdAt >= lastMonthStart && createdAt <= lastMonthEnd
    }),
  )

  const stageCounts = pipelineStages.map((stage) => ({
    ...stage,
    count: openDeals.filter((deal) => deal.stage === stage.id).length,
  }))

  const totalOpen = openDeals.length

  const stages: PipelineStageMetric[] = stageCounts.map((stage) => ({
    id: stage.id,
    label: stage.label,
    count: stage.count,
    share: totalOpen === 0 ? 0 : Math.round((stage.count / totalOpen) * 100),
  }))

  return {
    pipelineValue,
    pipelineValueFormatted: formatCurrency(pipelineValue),
    openCount: openDeals.length,
    wonCount: wonDeals.length,
    lostCount: lostDeals.length,
    wonValue,
    wonValueFormatted: formatCurrency(wonValue),
    winRate,
    winRateFormatted: `${winRate}%`,
    avgTicket,
    avgTicketFormatted: formatCurrency(avgTicket),
    stages,
    monthlyTrend: buildTrend(
      thisMonthOpenValue,
      lastMonthOpenValue,
      "ao mês anterior",
    ),
  }
}
