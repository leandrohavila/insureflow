import type { Activity, ActivityType } from "@/lib/data-access/modules/activities"

import {
  activityEventLabel,
  type ActivityEventKind,
} from "./activity-event-kinds"

export * from "./activity-event-kinds"

export const ACTIVITY_TIMELINE_PAGE_LIMIT = 50

export function isSystemActivity(activity: Activity): boolean {
  return Boolean(activity.operationalEventKind)
}

export type CommercialTimelineItem = {
  id: string
  source: "activity"
  kind: ActivityEventKind | ActivityType
  label: string
  subject: string
  description: string | null
  occurredAt: string
  isSystemEvent: boolean
  activity: Activity
}

function activityTimestamp(activity: Activity): number {
  const time = new Date(activity.occurredAt).getTime()
  return Number.isFinite(time) ? time : 0
}

/** Deduplica por id e ordena por occurredAt desc — uso leve em lanes e feeds. */
export function dedupeAndSortActivities(activities: Activity[]): Activity[] {
  const byId = new Map<string, Activity>()
  for (const activity of activities) {
    if (activity?.id) byId.set(activity.id, activity)
  }
  return Array.from(byId.values()).sort(
    (a, b) => activityTimestamp(b) - activityTimestamp(a),
  )
}

/** Builder unificado da Timeline Comercial a partir de Activities persistidas. */
export function buildCommercialTimeline(
  activities: Activity[],
): CommercialTimelineItem[] {
  return dedupeAndSortActivities(activities).map((activity) => {
    const operationalKind = activity.operationalEventKind
    const isSystemEvent = Boolean(operationalKind)

    return {
      id: activity.id,
      source: "activity" as const,
      kind: (operationalKind ?? activity.type) as ActivityEventKind | ActivityType,
      label: isSystemEvent
        ? activityEventLabel(operationalKind)
        : activity.type,
      subject: activity.subject,
      description: activity.description,
      occurredAt: activity.occurredAt,
      isSystemEvent,
      activity,
    }
  })
}

/** @deprecated Prefer dedupeAndSortActivities quando não precisar de CommercialTimelineItem */
export function commercialTimelineActivities(
  items: CommercialTimelineItem[],
): Activity[] {
  return items.map((item) => item.activity)
}
