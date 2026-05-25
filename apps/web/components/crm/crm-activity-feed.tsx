"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { FileText, MessageSquare, Receipt } from "lucide-react"

import {
  buildDealTimelinePreview,
  type CrmDealTimelinePreviewItem,
  type CrmDealTimelinePreviewType,
} from "@/lib/crm/crm-deal-timeline-preview"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import { GlassCard } from "@/components/dashboard/glass-card"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const activityIcon = {
  created: MessageSquare,
  note: FileText,
  value: Receipt,
} as const

const activityColor = {
  created: "bg-primary/15 text-primary ring-primary/25",
  note: "bg-white/[0.06] text-muted-foreground ring-white/10",
  value: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
} as const

function ActivityItem({
  activity,
  index,
}: {
  activity: CrmDealTimelinePreviewItem
  index: number
}) {
  const reduce = useReducedMotion()
  const Icon = activityIcon[activity.type as CrmDealTimelinePreviewType]

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
            activityColor[activity.type as CrmDealTimelinePreviewType],
          )}
        >
          <Icon className="size-3.5" strokeWidth={1.5} />
        </div>
        <span className="mt-2 w-px flex-1 bg-gradient-to-b from-white/10 to-transparent" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium tracking-tight text-foreground">
            {activity.title}
          </p>
          <span className="shrink-0 text-xs tabular-nums text-foreground/55">
            {activity.time}
          </span>
        </div>
        <p className="mt-1 text-sm leading-snug text-foreground/65">
          {activity.description}
        </p>
        <p className="mt-1 text-xs text-foreground/50">{activity.user}</p>
      </div>
    </motion.li>
  )
}

export function CrmActivityFeed({ deals }: { deals: CrmDeal[] }) {
  const activities = useMemo(
    () =>
      buildDealTimelinePreview(deals, {
        limit: 5,
        includeStage: false,
        relativeTime: true,
      }),
    [deals],
  )

  return (
    <GlassCard delay={0.2} hover={false} className="flex h-full flex-col p-0">
      <div className="border-b border-white/10 px-4 py-2.5">
        <h3 className="text-base font-semibold tracking-tight">Atividades</h3>
        <p className="text-sm text-foreground/60">
          Preview — domínio Activity no Sprint 1
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto px-4 py-3">
        {activities.length === 0 ? (
          <li className="text-sm text-foreground/60">
            Nenhuma movimentação recente no pipeline.
          </li>
        ) : (
          activities.map((activity, i) => (
            <ActivityItem key={activity.id} activity={activity} index={i} />
          ))
        )}
      </ul>
    </GlassCard>
  )
}
