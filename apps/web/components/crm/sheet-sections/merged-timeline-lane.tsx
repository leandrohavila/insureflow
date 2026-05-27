"use client"

import { useCallback, useMemo, useState } from "react"

import { ActivityFormDialog } from "@/components/activities/activity-form-dialog"
import { TimelineEmptyState } from "@/components/activities/timeline-empty-state"
import { TimelineEntry } from "@/components/activities/timeline-entry"
import { CrmSectionLoading } from "@/components/crm/interaction"
import { FilterChip, SectionPanel } from "@/components/crm/primitives"
import { activityTypeLabels } from "@/lib/crm/activity-labels"
import {
  activityTypeAccentVar,
  activityTypeIcons,
} from "@/lib/crm/activity-type-visual"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { buildTimelineGroups } from "@/lib/crm/timeline-groups"
import { useMergedActivityTimeline } from "@/lib/crm/relationship/hooks"
import {
  ACTIVITY_TYPES,
  pickActivityRelationFields,
  useCreateActivity,
  useDeleteActivity,
  useUpdateActivity,
  type Activity,
  type ActivityType,
  type CreateActivityInput,
} from "@/lib/data-access/modules/activities"
import { cn } from "@/lib/utils"

type MergedTimelineLaneProps = {
  leadIds?: string[]
  dealIds?: string[]
  className?: string
  title?: string
  showFilters?: boolean
  density?: "default" | "compact"
}

const emptyCtx = {}

/**
 * Timeline operacional agregada para Contact/Company workspaces.
 * Não altera TimelineLane V2 — compõe múltiplos contextos lead/deal.
 */
export function MergedTimelineLane({
  leadIds = [],
  dealIds = [],
  className,
  title = "Timeline operacional",
  showFilters = true,
  density = "default",
}: MergedTimelineLaneProps) {
  const timeline = useMergedActivityTimeline({ leadIds, dealIds })
  const activities = timeline.data

  const updateActivity = useUpdateActivity(emptyCtx)
  const createActivity = useCreateActivity(emptyCtx)
  const deleteActivity = useDeleteActivity(emptyCtx)

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [rescheduleSource, setRescheduleSource] = useState<Activity | null>(
    null,
  )
  const [rescheduleContext, setRescheduleContext] = useState<{
    leadId?: string | null
    dealId?: string | null
  } | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [activeFilter, setActiveFilter] = useState<ActivityType | null>(null)

  const handleEdit = useCallback((activity: Activity) => {
    setEditingActivity(activity)
  }, [])

  const handleComplete = useCallback(
    (activity: Activity) => {
      setCompletingId(activity.id)
      updateActivity.mutate(
        {
          id: activity.id,
          input: {
            status: "completed",
            nextFollowUpAt: null,
            ...pickActivityRelationFields(activity),
          },
        },
        { onSettled: () => setCompletingId(null) },
      )
    },
    [updateActivity],
  )

  const handleReschedule = useCallback((activity: Activity) => {
    setRescheduleSource(activity)
    setRescheduleContext({
      leadId: activity.leadId,
      dealId: activity.dealId,
    })
  }, [])

  const handleDelete = useCallback(
    (activity: Activity) => {
      if (
        !window.confirm("Excluir esta atividade do histórico operacional?")
      ) {
        return
      }
      setDeletingId(activity.id)
      deleteActivity.mutate(activity.id, {
        onSettled: () => setDeletingId(null),
      })
    },
    [deleteActivity],
  )

  const countsByType = useMemo(() => {
    const map = new Map<ActivityType, number>()
    for (const activity of activities) {
      map.set(activity.type, (map.get(activity.type) ?? 0) + 1)
    }
    return map
  }, [activities])

  const filteredActivities = useMemo(() => {
    if (!activeFilter) return activities
    return activities.filter((activity) => activity.type === activeFilter)
  }, [activities, activeFilter])

  const groups = useMemo(
    () => buildTimelineGroups(filteredActivities),
    [filteredActivities],
  )

  const total = activities.length
  const filteredCount = activeFilter
    ? (countsByType.get(activeFilter) ?? 0)
    : total
  const latestOccurredAt = activities[0]?.occurredAt ?? null
  const availableTypes = ACTIVITY_TYPES.filter((type) => countsByType.has(type))
  const showEmptyFilterHint =
    activeFilter !== null && filteredCount === 0 && total > 0
  const isEmpty = !timeline.isLoading && total === 0

  return (
    <SectionPanel
      tone="panel"
      density={density}
      bordered
      dividedHeader
      className={cn("timeline-lane-v2", className)}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {title}
          {!timeline.isLoading ? (
            <span className="crm-text-meta tabular-nums">
              · {total} {total === 1 ? "registro" : "registros"}
            </span>
          ) : null}
        </span>
      }
      description={
        !timeline.isLoading && latestOccurredAt ? (
          <span className="crm-text-meta">
            Última interação: {formatLastInteraction(latestOccurredAt)}
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        {timeline.isError ? (
          <p className="text-sm text-destructive">
            Não foi possível carregar parte do histórico. Atualize a página ou
            tente novamente em instantes.
          </p>
        ) : null}

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
          isLoading={timeline.isLoading}
          label="Carregando histórico operacional…"
          variant="inline"
        />

        {isEmpty ? <TimelineEmptyState /> : null}
        {showEmptyFilterHint ? (
          <TimelineEmptyState
            filtered
            filterLabel={activityTypeLabels[activeFilter!]}
          />
        ) : null}

        {!timeline.isLoading && !isEmpty && !showEmptyFilterHint ? (
          <div className="timeline-lane">
            {groups.map((group) => (
              <section key={group.key} className="flex flex-col gap-3">
                <h4 className="crm-text-micro sticky top-0 z-[1] bg-[var(--crm-surface-panel)] py-1 text-muted-foreground/80">
                  {group.label}
                </h4>
                <ol className="timeline-rail timeline-rail--v2 m-0 list-none p-0">
                  {group.activities.map((activity) => (
                    <TimelineEntry
                      key={activity.id}
                      activity={activity}
                      contextLeadId={undefined}
                      contextDealId={undefined}
                      isCompleting={completingId === activity.id}
                      isDeleting={deletingId === activity.id}
                      onEdit={handleEdit}
                      onComplete={handleComplete}
                      onReschedule={handleReschedule}
                      onDelete={handleDelete}
                    />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : null}
      </div>

      <ActivityFormDialog
        open={editingActivity !== null}
        onOpenChange={(open) => {
          if (!open) setEditingActivity(null)
        }}
        activity={editingActivity}
        leadId={editingActivity?.leadId}
        dealId={editingActivity?.dealId}
        pending={updateActivity.isPending}
        error={updateActivity.error}
        onSubmit={(input: CreateActivityInput) => {
          if (!editingActivity) return
          updateActivity.mutate(
            { id: editingActivity.id, input },
            { onSuccess: () => setEditingActivity(null) },
          )
        }}
      />

      <ActivityFormDialog
        open={rescheduleContext !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleContext(null)
            setRescheduleSource(null)
          }
        }}
        initialType="follow_up"
        leadId={rescheduleContext?.leadId}
        dealId={rescheduleContext?.dealId}
        pending={createActivity.isPending}
        error={createActivity.error}
        onSubmit={(input: CreateActivityInput) => {
          const source = rescheduleSource
          createActivity.mutate(
            {
              ...input,
              type: "follow_up",
              ...(source ? pickActivityRelationFields(source) : {}),
            },
            {
              onSuccess: () => {
                setRescheduleContext(null)
                setRescheduleSource(null)
                if (source?.status === "pending") {
                  updateActivity.mutate({
                    id: source.id,
                    input: {
                      status: "completed",
                      nextFollowUpAt: null,
                      ...pickActivityRelationFields(source),
                    },
                  })
                }
              },
            },
          )
        }}
      />
    </SectionPanel>
  )
}
