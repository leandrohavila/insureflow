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
import { StatusPill, type StatusPillTone } from "@/components/crm/primitives"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

/** Os tons padrão do StatusPill são calibrados para fundo escuro; o feed fica sobre card branco. */
const FEED_PILL_TONES: Record<StatusPillTone, string> = {
  neutral: "bg-[#f6f1e8] text-[#3d4658] ring-[#d6cfc4]",
  brand:
    "bg-[var(--avila-navy-900)]/[0.07] text-[var(--avila-navy-900)] ring-[var(--avila-navy-900)]/20",
  info: "bg-[#1a5fbf]/[0.08] text-[#1a5fbf] ring-[#1a5fbf]/25",
  success: "bg-[#157a3c]/[0.08] text-[#157a3c] ring-[#157a3c]/25",
  warn: "bg-amber-50 text-amber-800 ring-amber-300",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
}

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
      className="relative flex gap-3 pb-5! last:pb-0!"
    >
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1",
            isSystemEvent
              ? "bg-[var(--avila-navy-900)]/10 text-[var(--avila-navy-900)] ring-[#d6cfc4]"
              : "bg-white text-[var(--avila-navy-900)] ring-[#d6cfc4]",
          )}
        >
          <Icon className="size-3.5" strokeWidth={1.5} aria-hidden />
        </div>
        <span className="mt-1.5! w-px flex-1 bg-[#e4ddd2]" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5!">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight break-words text-[var(--avila-navy-900)]">
              {activity.subject}
            </p>
            <StatusPill
              tone={tone}
              variant="soft"
              size="xs"
              className={cn(
                "mt-1.5! h-auto max-w-full px-1.5! py-0.5! text-[11px] leading-tight whitespace-normal",
                FEED_PILL_TONES[tone],
              )}
            >
              {label}
            </StatusPill>
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-[#5c6578]">
            {formatTimelineCompactTime(activity.occurredAt)}
          </span>
        </div>
        {activity.description ? (
          <p className="mt-1! text-sm leading-snug break-words whitespace-pre-wrap text-[#3d4658]">
            {activity.description}
          </p>
        ) : null}
        <p className="mt-1! text-xs text-[#5c6578]">
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
    <AppCard className="flex h-full flex-col overflow-hidden border-[#d6cfc4]! bg-white!" padding="none">
      <div className="border-b border-[#e4ddd2] px-4! py-3!">
        <h3 className="text-base font-semibold tracking-tight text-[var(--avila-navy-900)]">Atividades</h3>
        <p className="text-sm text-[#5c6578]">
          Timeline comercial recente
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto px-4! py-4!">
        {activitiesQuery.isLoading ? (
          <li className="flex items-center gap-2 text-sm text-[#5c6578]">
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
