"use client"

import { memo, useCallback, type CSSProperties } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Briefcase,
  CalendarClock,
  Check,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import { StatusPill } from "@/components/crm/primitives"
import { activityTypeLabels } from "@/lib/crm/activity-labels"
import {
  activityTypeAccentVar,
  activityTypeIcons,
  activityTypeTones,
} from "@/lib/crm/activity-type-visual"
import {
  formatTimelineCompactTime,
  formatTimelineFullDateTime,
} from "@/lib/crm/timeline-groups"
import {
  buildEntitySheetHref,
  buildReturnToFromCurrentLocation,
} from "@/lib/crm/entity-sheet-navigation"
import type { Activity } from "@/lib/data-access/modules/activities"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type TimelineEntryProps = {
  activity: Activity
  /** Contexto do sheet — oculta link redundante para a entidade atual. */
  contextLeadId?: string | null
  contextDealId?: string | null
  isCompleting?: boolean
  isDeleting?: boolean
  onEdit: (activity: Activity) => void
  onComplete: (activity: Activity) => void
  onReschedule: (activity: Activity) => void
  onDelete: (activity: Activity) => void
}

function TimelineEntryComponent({
  activity,
  contextLeadId,
  contextDealId,
  isCompleting,
  isDeleting,
  onEdit,
  onComplete,
  onReschedule,
  onDelete,
}: TimelineEntryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const Icon = activityTypeIcons[activity.type]
  const typeLabel = activityTypeLabels[activity.type]
  const accentVar = activityTypeAccentVar[activity.type]
  const typeTone = activityTypeTones[activity.type]

  const showComplete =
    activity.status === "pending" &&
    (activity.type === "follow_up" || Boolean(activity.nextFollowUpAt))

  const showReschedule =
    activity.status === "pending" &&
    (activity.type === "follow_up" || Boolean(activity.nextFollowUpAt))

  const showOpenDeal =
    Boolean(activity.dealId) && activity.dealId !== contextDealId

  const showOpenLead =
    Boolean(activity.leadId) && activity.leadId !== contextLeadId

  const openDeal = useCallback(() => {
    if (!activity.dealId) return
    const returnTo = buildReturnToFromCurrentLocation(pathname, searchParams)
    router.push(
      buildEntitySheetHref({
        entityType: "deal",
        entityId: activity.dealId,
        origin: "timeline",
        returnTo,
      }),
    )
  }, [activity.dealId, pathname, router, searchParams])

  const openLead = useCallback(() => {
    if (!activity.leadId) return
    const returnTo = buildReturnToFromCurrentLocation(pathname, searchParams)
    router.push(
      buildEntitySheetHref({
        entityType: "lead",
        entityId: activity.leadId,
        origin: "timeline",
        returnTo,
      }),
    )
  }, [activity.leadId, pathname, router, searchParams])

  const entryStyle = {
    ["--crm-node-accent" as string]: accentVar,
  } as CSSProperties

  return (
    <li
      className="timeline-entry timeline-entry--v2"
      data-occurred-at={activity.occurredAt}
      data-activity-type={activity.type}
      data-activity-status={activity.status}
      style={entryStyle}
    >
      <span
        className="timeline-node"
        aria-hidden
        data-activity-node-type={activity.type}
      >
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>

      <article className="timeline-card">
        <header className="timeline-card__header">
          <div className="timeline-card__primary min-w-0 flex-1">
            <h4 className="timeline-card__subject">{activity.subject}</h4>
            <div className="timeline-card__badges">
              <StatusPill tone={typeTone} variant="soft" size="xs">
                {typeLabel}
              </StatusPill>
              {activity.status === "pending" ? (
                <StatusPill tone="warn" variant="ghost" size="xs" dot>
                  Pendente
                </StatusPill>
              ) : null}
              {activity.status === "completed" ? (
                <StatusPill tone="success" variant="ghost" size="xs" dot>
                  Concluído
                </StatusPill>
              ) : null}
            </div>
          </div>

          <time
            className="timeline-card__time crm-text-micro tabular-nums"
            dateTime={activity.occurredAt}
            title={formatTimelineFullDateTime(activity.occurredAt)}
          >
            {formatTimelineCompactTime(activity.occurredAt)}
          </time>
        </header>

        {activity.description ? (
          <p className="timeline-card__description crm-text-meta line-clamp-2 whitespace-pre-line">
            {activity.description}
          </p>
        ) : null}

        <div className="timeline-card__footer">
          <div className="timeline-card__signals min-w-0 flex-1">
            {activity.outcome ? (
              <p className="timeline-outcome timeline-outcome--compact">
                <span className="timeline-outcome-label">Resultado</span>
                <span className="truncate">{activity.outcome}</span>
              </p>
            ) : null}

            {activity.nextFollowUpAt ? (
              <p className="timeline-followup timeline-followup--compact">
                <CalendarClock className="size-3 shrink-0" strokeWidth={1.75} />
                <span>
                  Follow-up{" "}
                  <time
                    className="tabular-nums"
                    dateTime={activity.nextFollowUpAt}
                  >
                    {formatTimelineFullDateTime(activity.nextFollowUpAt)}
                  </time>
                </span>
              </p>
            ) : null}
          </div>

          <div className="timeline-card__performer">
            <Avatar
              className="size-5"
              style={{ border: "1px solid var(--crm-stroke-faint)" }}
            >
              <AvatarFallback className="bg-primary/15 text-[8px] text-primary">
                {activity.performedBy.initials}
              </AvatarFallback>
            </Avatar>
            <span className="crm-text-micro max-w-[9rem] truncate">
              {activity.performedBy.name}
            </span>
          </div>
        </div>

        <PermissionGate permission="crm:manage">
          <div className="timeline-entry__actions timeline-entry__actions--v2">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="size-7"
              onClick={() => onEdit(activity)}
              aria-label={`Editar ${typeLabel.toLowerCase()}`}
            >
              <Pencil className="size-3.5" strokeWidth={1.5} />
            </Button>

            {showComplete ? (
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                className="size-7 text-emerald-400 hover:text-emerald-300"
                disabled={isCompleting}
                onClick={() => onComplete(activity)}
                aria-label="Marcar concluído"
              >
                {isCompleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" strokeWidth={1.5} />
                )}
              </Button>
            ) : null}

            {showReschedule ? (
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                className="size-7"
                onClick={() => onReschedule(activity)}
                aria-label="Reagendar follow-up"
              >
                <RefreshCw className="size-3.5" strokeWidth={1.5} />
              </Button>
            ) : null}

            {showOpenDeal ? (
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                className="size-7"
                onClick={openDeal}
                aria-label="Abrir negócio vinculado"
              >
                <Briefcase className="size-3.5" strokeWidth={1.5} />
              </Button>
            ) : null}

            {showOpenLead ? (
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                className="size-7"
                onClick={openLead}
                aria-label="Abrir lead vinculado"
              >
                <UserRound className="size-3.5" strokeWidth={1.5} />
              </Button>
            ) : null}

            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className={cn(
                "size-7 text-destructive/80 hover:text-destructive",
              )}
              disabled={isDeleting}
              onClick={() => onDelete(activity)}
              aria-label={`Excluir ${typeLabel.toLowerCase()}`}
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              )}
            </Button>
          </div>
        </PermissionGate>
      </article>
    </li>
  )
}

export const TimelineEntry = memo(TimelineEntryComponent)
