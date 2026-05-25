"use client"

import { useMemo, useState } from "react"

import { ActivityTimeline } from "@/components/activities/activity-timeline"
import { TimelineEmptyState } from "@/components/activities/timeline-empty-state"
import { CrmSectionLoading } from "@/components/crm/interaction"
import { FilterChip, SectionPanel } from "@/components/crm/primitives"
import { activityTypeLabels } from "@/lib/crm/activity-labels"
import {
  activityTypeAccentVar,
  activityTypeIcons,
} from "@/lib/crm/activity-type-visual"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import {
  ACTIVITY_TYPES,
  useActivityTimeline,
  type Activity,
  type ActivityType,
} from "@/lib/data-access/modules/activities"
import { cn } from "@/lib/utils"

type TimelineLaneProps = {
  leadId?: string | null
  dealId?: string | null
  className?: string
  /** Título do header. Default: "Timeline operacional". */
  title?: string
  /** Mostra o FilterBar de tipos. Default: true. */
  showFilters?: boolean
  /** Densidade do wrapper. Default: "default". */
  density?: "default" | "compact"
}

/**
 * TimelineLane V2 — wrapper operacional enterprise sobre `ActivityTimeline`.
 *
 * Fase 2.2:
 * - SectionPanel com header operacional + contagem
 * - FilterBar visual por tipo (CSS `[data-filter]`, sem refetch)
 * - Empty state premium quando histórico vazio
 * - Empty contextual quando filtro elimina todos os itens
 * - Sticky headers temporais delegados ao `ActivityTimeline` + CSS rail
 *
 * Não altera queries, DTOs, mutations ou domínio Activities.
 * `useActivityTimeline` é deduplicado pelo React Query com o filho embedded.
 */
export function TimelineLane({
  leadId,
  dealId,
  className,
  title = "Timeline operacional",
  showFilters = true,
  density = "default",
}: TimelineLaneProps) {
  const timelineQuery = useActivityTimeline({ leadId, dealId })
  const activities = useMemo<Activity[]>(
    () => timelineQuery.data?.data ?? [],
    [timelineQuery.data?.data],
  )

  const [activeFilter, setActiveFilter] = useState<ActivityType | null>(null)

  const countsByType = useMemo(() => {
    const map = new Map<ActivityType, number>()
    for (const activity of activities) {
      map.set(activity.type, (map.get(activity.type) ?? 0) + 1)
    }
    return map
  }, [activities])

  const total = activities.length
  const filteredCount = activeFilter
    ? (countsByType.get(activeFilter) ?? 0)
    : total

  const latestOccurredAt = activities[0]?.occurredAt ?? null

  const availableTypes = useMemo<ActivityType[]>(() => {
    return ACTIVITY_TYPES.filter((type) => countsByType.has(type))
  }, [countsByType])

  const showEmptyFilterHint =
    activeFilter !== null && filteredCount === 0 && total > 0

  const isLoading = timelineQuery.isLoading
  const isEmpty = !isLoading && total === 0

  return (
    <SectionPanel
      tone="panel"
      density={density}
      bordered
      dividedHeader
      className={cn("timeline-lane-v2", className)}
      title={
        <span className="flex items-center gap-2">
          {title}
          {!isLoading ? (
            <span className="crm-text-meta tabular-nums">
              · {total} {total === 1 ? "registro" : "registros"}
            </span>
          ) : null}
        </span>
      }
      description={
        !isLoading && latestOccurredAt ? (
          <span className="crm-text-meta">
            Última interação: {formatLastInteraction(latestOccurredAt)}
          </span>
        ) : undefined
      }
      eyebrow={
        activeFilter ? (
          <span className="crm-text-micro flex items-center gap-1.5">
            Filtrando por
            <span className="text-primary">
              {activityTypeLabels[activeFilter]}
            </span>
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              className="text-muted-foreground/70 underline-offset-2 hover:underline"
            >
              limpar
            </button>
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        {showFilters && !isEmpty && availableTypes.length > 0 ? (
          <nav
            aria-label="Filtrar timeline por tipo"
            className="flex flex-wrap items-center gap-1.5"
          >
            <FilterChip
              isActive={activeFilter === null}
              label="Todos"
              count={total}
              onClick={() => setActiveFilter(null)}
            />
            {availableTypes.map((type) => (
              <FilterChip
                key={type}
                isActive={activeFilter === type}
                icon={activityTypeIcons[type]}
                accentVar={activityTypeAccentVar[type]}
                label={activityTypeLabels[type]}
                count={countsByType.get(type) ?? 0}
                onClick={() =>
                  setActiveFilter((current) =>
                    current === type ? null : type,
                  )
                }
              />
            ))}
          </nav>
        ) : null}

        <CrmSectionLoading
          isLoading={isLoading}
          label="Carregando histórico operacional…"
          variant="inline"
        />

        {isEmpty ? (
          <TimelineEmptyState />
        ) : null}

        {showEmptyFilterHint ? (
          <TimelineEmptyState
            filtered
            filterLabel={activityTypeLabels[activeFilter!]}
          />
        ) : null}

        {!isLoading && !isEmpty && !showEmptyFilterHint ? (
          <div
            className="timeline-lane"
            data-filter={activeFilter ?? undefined}
            data-total={total}
          >
            <ActivityTimeline
              leadId={leadId}
              dealId={dealId}
              showHeading={false}
              suppressEmptyState
            />
          </div>
        ) : null}
      </div>
    </SectionPanel>
  )
}
