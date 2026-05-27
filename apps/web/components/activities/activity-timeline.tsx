"use client"

import { Fragment, useCallback, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

import { ActivityFormDialog } from "@/components/activities/activity-form-dialog"
import { TimelineEmptyState } from "@/components/activities/timeline-empty-state"
import { TimelineEntry } from "@/components/activities/timeline-entry"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { buildTimelineGroups } from "@/lib/crm/timeline-groups"
import { getErrorMessage } from "@/lib/data-access"
import {
  pickActivityRelationFields,
  useActivityTimeline,
  useCreateActivity,
  useDeleteActivity,
  useUpdateActivity,
  type Activity,
  type CreateActivityInput,
} from "@/lib/data-access/modules/activities"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ActivityTimelineProps = {
  leadId?: string | null
  dealId?: string | null
  className?: string
  showHeading?: boolean
  /** Quando true, não renderiza empty state (delegado ao TimelineLane). */
  suppressEmptyState?: boolean
}

export function ActivityTimeline({
  leadId,
  dealId,
  className,
  showHeading = true,
  suppressEmptyState = false,
}: ActivityTimelineProps) {
  const ctx = { leadId, dealId }
  const timelineQuery = useActivityTimeline(ctx)
  const updateActivity = useUpdateActivity(ctx)
  const createActivity = useCreateActivity(ctx)
  const deleteActivity = useDeleteActivity(ctx)

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

  const activities = useMemo(
    () => timelineQuery.data?.data ?? [],
    [timelineQuery.data?.data],
  )
  const latestOccurredAt = activities[0]?.occurredAt ?? null

  const groups = useMemo(
    () => buildTimelineGroups(activities),
    [activities],
  )

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
      leadId: activity.leadId ?? leadId,
      dealId: activity.dealId ?? dealId,
    })
  }, [dealId, leadId])

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

  if (timelineQuery.isLoading) {
    return (
      <div
        className={cn(
          "timeline-loading flex items-center gap-2 crm-text-meta",
          className,
        )}
      >
        <Loader2 className="size-4 animate-spin" />
        Carregando timeline…
      </div>
    )
  }

  if (timelineQuery.isError) {
    return (
      <div className={cn("space-y-2", className)}>
        <p className="text-sm text-destructive">
          {getErrorMessage(timelineQuery.error, "Erro ao carregar atividades")}
        </p>
        <Button size="sm" variant="outline" onClick={() => timelineQuery.refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (activities.length === 0) {
    if (suppressEmptyState) return null
    return (
      <section className={className}>
        <TimelineEmptyState />
      </section>
    )
  }

  return (
    <section className={cn("timeline-operational", className)}>
      {showHeading ? (
        <div className="timeline-operational__heading mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="crm-text-micro tracking-[0.12em] uppercase">
              Timeline operacional
            </h3>
            <p className="crm-text-meta mt-1">
              {formatLastInteraction(latestOccurredAt)}
            </p>
          </div>
        </div>
      ) : null}

      <ol className="timeline-rail timeline-rail--v2">
        {groups.map((group) => (
          <Fragment key={group.key}>
            <li className="timeline-day-header" aria-label={group.label}>
              <span className="timeline-day-label">{group.label}</span>
              <span aria-hidden className="timeline-day-divider" />
              <span className="timeline-day-count tabular-nums">
                {group.activities.length}
              </span>
            </li>

            {group.activities.map((activity) => (
              <TimelineEntry
                key={activity.id}
                activity={activity}
                contextLeadId={leadId}
                contextDealId={dealId}
                isCompleting={completingId === activity.id}
                isDeleting={deletingId === activity.id}
                onEdit={handleEdit}
                onComplete={handleComplete}
                onReschedule={handleReschedule}
                onDelete={handleDelete}
              />
            ))}
          </Fragment>
        ))}
      </ol>

      <ActivityFormDialog
        open={editingActivity !== null}
        onOpenChange={(open) => {
          if (!open) setEditingActivity(null)
        }}
        activity={editingActivity}
        leadId={leadId}
        dealId={dealId}
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
            { ...input, type: "follow_up" },
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
    </section>
  )
}
