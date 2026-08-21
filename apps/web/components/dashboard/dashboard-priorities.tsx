"use client"

import type { DashboardKpi } from "@/lib/data-access/modules/dashboard/hooks"

import {
  DashboardPriorityItem,
  type PriorityLevel,
} from "./dashboard-priority-item"
import { DashboardSection } from "./dashboard-section"
import {
  parseDashboardMetricNumber,
  pickDashboardKpi,
} from "./dashboard-utils"

type PriorityEntry = {
  id: string
  level: PriorityLevel
  description: string
  count: number
  placeholder?: boolean
}

type DashboardPrioritiesProps = {
  kpis: DashboardKpi[]
  crmEnabled: boolean
  quotesEnabled: boolean
  leadsEnabled: boolean
}

const MAX_PRIORITIES = 5

const levelOrder: Record<PriorityLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function DashboardPriorities({
  kpis,
  crmEnabled,
  quotesEnabled,
  leadsEnabled,
}: DashboardPrioritiesProps) {
  const loading = kpis.some((kpi) => kpi.isLoading)
  const items: PriorityEntry[] = []

  if (crmEnabled) {
    const overdue = parseDashboardMetricNumber(
      pickDashboardKpi(kpis, "overdueActivities"),
    )
    if (overdue > 0) {
      items.push({
        id: "follow-ups",
        level: "high",
        description: "Follow-ups atrasados",
        count: overdue,
      })
    }
  }

  if (leadsEnabled) {
    const activeLeads = parseDashboardMetricNumber(
      pickDashboardKpi(kpis, "activeLeads"),
    )
    if (activeLeads > 0) {
      items.push({
        id: "leads",
        level: "medium",
        description: "Leads sem contato",
        count: activeLeads,
      })
    }
  }

  if (quotesEnabled) {
    const proposalsWaiting = parseDashboardMetricNumber(
      pickDashboardKpi(kpis, "proposalsAwaitingResponse"),
    )
    if (proposalsWaiting > 0) {
      items.push({
        id: "proposals",
        level: "medium",
        description: "Propostas aguardando",
        count: proposalsWaiting,
      })
    }
  }

  items.push({
    id: "renewals",
    level: "medium",
    description: "Renovações esta semana",
    count: 0,
    placeholder: true,
  })

  if (crmEnabled) {
    const pending = parseDashboardMetricNumber(
      pickDashboardKpi(kpis, "pendingActivities"),
    )
    if (pending > 0) {
      items.push({
        id: "activities",
        level: "low",
        description: "Atividades pendentes",
        count: pending,
      })
    }
  }

  if (quotesEnabled) {
    const quotesInProgress = parseDashboardMetricNumber(
      pickDashboardKpi(kpis, "quotesInProgress"),
    )
    if (quotesInProgress > 0 && items.length < MAX_PRIORITIES) {
      items.push({
        id: "quotes",
        level: "low",
        description: "Cotações em andamento",
        count: quotesInProgress,
      })
    }
  }

  const visible = items
    .sort((a, b) => levelOrder[a.level] - levelOrder[b.level])
    .slice(0, MAX_PRIORITIES)

  const hasActionable = visible.some((item) => item.count > 0 && !item.placeholder)

  return (
    <DashboardSection
      title="Prioridades do dia"
      dense
      fill
      loading={loading}
      emptyState={
        !hasActionable ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma prioridade urgente hoje.
          </p>
        ) : undefined
      }
    >
      {visible.length > 0 ? (
        <ul className="-mx-0.5">
          {visible.map((item) => (
            <DashboardPriorityItem
              key={item.id}
              id={item.id}
              level={item.level}
              count={item.count}
              description={
                item.placeholder
                  ? `${item.description} — em breve`
                  : item.description
              }
              placeholder={item.placeholder}
            />
          ))}
        </ul>
      ) : null}
    </DashboardSection>
  )
}
