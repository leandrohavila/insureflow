"use client"

import Link from "next/link"
import { useMemo } from "react"
import { CalendarPlus, Phone, RotateCcw } from "lucide-react"

import { startOfToday } from "@/components/crm/task-workspace/task-workspace-utils"
import { activityTypeLabels } from "@/lib/crm/activity-labels"
import { Inline } from "@/components/design-system"
import { buttonVariants } from "@/components/ui/button"
import { useActivities } from "@/lib/data-access/modules/activities"
import { cn } from "@/lib/utils"

import { DashboardSection } from "./dashboard-section"
import {
  dashboardCardLinkClassName,
  dashboardInteractiveItemClassName,
  formatAgendaTime,
  isSameCalendarDay,
} from "./dashboard-utils"

const AGENDA_LIMIT = 5

type DashboardAgendaPreviewProps = {
  canCreate?: boolean
}

export function DashboardAgendaPreview({ canCreate = false }: DashboardAgendaPreviewProps) {
  const activitiesQuery = useActivities({ status: "pending", limit: 50 })

  const items = useMemo(() => {
    const today = startOfToday()
    const rows = activitiesQuery.data?.data ?? []

    return rows
      .map((activity) => {
        const when = activity.nextFollowUpAt ?? activity.occurredAt
        return { activity, when: new Date(when) }
      })
      .filter(({ when }) => isSameCalendarDay(when, today))
      .sort((a, b) => a.when.getTime() - b.when.getTime())
      .slice(0, AGENDA_LIMIT)
  }, [activitiesQuery.data?.data])

  const action = (
    <Link
      href="/crm/agenda"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        dashboardCardLinkClassName,
        "h-6 px-1.5 transition-colors duration-[var(--if-duration-base)] hover:text-foreground",
      )}
    >
      Ver Agenda →
    </Link>
  )

  const emptyActions = canCreate ? (
    <Inline wrap className="gap-1">
      <Link
        href="/crm/agenda"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-6 gap-1 px-2 text-[0.6875rem]",
        )}
      >
        <CalendarPlus className="size-3" aria-hidden />
        Criar atividade
      </Link>
      <Link
        href="/crm/agenda"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          dashboardInteractiveItemClassName,
          "h-6 gap-1 px-2 text-[0.6875rem] text-muted-foreground hover:text-foreground",
        )}
      >
        <Phone className="size-3" aria-hidden />
        Agendar ligação
      </Link>
      <Link
        href="/crm/agenda"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          dashboardInteractiveItemClassName,
          "h-6 gap-1 px-2 text-[0.6875rem] text-muted-foreground hover:text-foreground",
        )}
      >
        <RotateCcw className="size-3" aria-hidden />
        Novo Follow-up
      </Link>
    </Inline>
  ) : null

  return (
    <DashboardSection
      title="Agenda"
      dense
      fill
      action={action}
      loading={activitiesQuery.isLoading}
      emptyState={
        <div className="space-y-1.5">
          <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
            Hoje
          </p>
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade programada.
          </p>
          {emptyActions}
        </div>
      }
    >
      {items.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
            Hoje
          </p>
          <ul className="space-y-0.5 border-l border-border/60 pl-[var(--if-space-3)]">
            {items.map(({ activity, when }) => (
              <li
                key={activity.id}
                className={cn(
                  dashboardInteractiveItemClassName,
                  "relative min-w-0 py-0.5 pl-1 text-sm text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="absolute -left-[calc(var(--if-space-3)+3px)] top-[0.45rem] size-1.5 rounded-full bg-primary/70"
                />
                <div className="flex min-w-0 gap-[var(--if-space-2)]">
                  <span className="w-9 shrink-0 tabular-nums text-[0.6875rem] text-muted-foreground">
                    {formatAgendaTime(when.toISOString())}
                  </span>
                  <span className="min-w-0 truncate text-sm">
                    {activityTypeLabels[activity.type]} {activity.subject}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DashboardSection>
  )
}
