"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Loader2, Sparkles } from "lucide-react"

import {
  activityEventLabel,
  buildCommercialTimeline,
  isSystemActivity,
} from "@/lib/crm/commercial-timeline"
import { activityTypeLabels } from "@/lib/crm/activity-labels"
import {
  activityTypeIcons,
  activityTypeTones,
} from "@/lib/crm/activity-type-visual"
import { formatTimelineCompactTime } from "@/lib/crm/timeline-groups"
import {
  useRecentActivities,
  type Activity,
} from "@/lib/data-access/modules/activities"
import { AppCard, EmptyState } from "@/components/design-system"
import { StatusPill } from "@/components/crm/primitives"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

function ActivityFeedItem({
  activity,
  index,
}: {
  activity: Activity
  index: number
}) {
  const reduce = useReducedMotion()
  const isSystemEvent = isSystemActivity(activity)
  const Icon = isSystemEvent
    ? Sparkles
    : activityTypeIcons[activity.type]
  const label = isSystemEvent
    ? activityEventLabel(activity.operationalEventKind)
    : activityTypeLabels[activity.type]
  const tone = isSystemEvent ? "brand" : activityTypeTones[activity.type]

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.06 * index, duration: 0.35, ease: easeOut }}
      className="relative flex gap-3 pb-6 last:pb-0"
    >
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1",
            isSystemEvent
              ? "bg-primary/15 text-primary ring-primary/25"
              : "bg-white/[0.06] text-muted-foreground ring-white/10",
          )}
        >
          <Icon className="size-3.5" strokeWidth={1.5} aria-hidden />
        </div>
        <span className="mt-2 w-px flex-1 bg-gradient-to-b from-white/10 to-transparent" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium tracking-tight text-foreground">
              {activity.subject}
            </p>
            <StatusPill tone={tone} variant="soft" size="xs" className="mt-1">
              {label}
            </StatusPill>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-foreground/55">
            {formatTimelineCompactTime(activity.occurredAt)}
          </span>
        </div>
        {activity.description ? (
          <p className="mt-1 text-sm leading-snug text-foreground/65 line-clamp-2">
            {activity.description}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-foreground/50">
          {activity.performedBy.name}
        </p>
      </div>
    </motion.li>
  )
}

export function CrmActivityFeed() {
  const activitiesQuery = useRecentActivities(5)

  const activities = useMemo(() => {
    const raw = activitiesQuery.data?.data ?? []
    return buildCommercialTimeline(raw).map((item) => item.activity)
  }, [activitiesQuery.data?.data])

  return (
    <AppCard className="flex h-full flex-col overflow-hidden" padding="none">
      <div className="border-b border-white/10 px-4 py-2.5">
        <h3 className="text-base font-semibold tracking-tight">Atividades</h3>
        <p className="text-sm text-foreground/60">
          Timeline comercial recente
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto px-4 py-3">
        {activitiesQuery.isLoading ? (
          <li className="flex items-center gap-2 text-sm text-foreground/60">
            <Loader2 className="size-4 animate-spin" />
            Carregando atividades…
          </li>
        ) : activities.length === 0 ? (
          <li>
            <EmptyState
              title="Sem movimentações recentes"
              description="Nenhuma atividade comercial registrada ainda."
            />
          </li>
        ) : (
          activities.map((activity, i) => (
            <ActivityFeedItem key={activity.id} activity={activity} index={i} />
          ))
        )}
      </ul>
    </AppCard>
  )
}
