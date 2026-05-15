"use client"

import { motion, useReducedMotion } from "framer-motion"
import {
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Receipt,
} from "lucide-react"

import type { CrmActivity } from "@/lib/crm-mock"
import { crmActivities } from "@/lib/crm-mock"
import { GlassCard } from "@/components/dashboard/glass-card"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const activityIcon = {
  call: Phone,
  email: Mail,
  meeting: MessageSquare,
  note: FileText,
  quote: Receipt,
} as const

const activityColor = {
  call: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
  email: "bg-violet-500/15 text-violet-200 ring-violet-500/25",
  meeting: "bg-primary/15 text-primary ring-primary/25",
  note: "bg-white/[0.06] text-muted-foreground ring-white/10",
  quote: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
} as const

function ActivityItem({
  activity,
  index,
}: {
  activity: CrmActivity
  index: number
}) {
  const reduce = useReducedMotion()
  const Icon = activityIcon[activity.type]

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
            activityColor[activity.type]
          )}
        >
          <Icon className="size-3.5" strokeWidth={1.5} />
        </div>
        <span className="mt-2 w-px flex-1 bg-gradient-to-b from-white/10 to-transparent" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-medium tracking-[-0.02em] text-foreground">
            {activity.title}
          </p>
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {activity.time}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {activity.description}
        </p>
        <p className="mt-1.5 text-[10px] text-muted-foreground/70">{activity.user}</p>
      </div>
    </motion.li>
  )
}

export function CrmActivityFeed() {
  return (
    <GlassCard delay={0.2} hover={false} className="flex h-full flex-col p-0">
      <div className="border-b border-white/[0.06] px-5 py-4 md:px-6">
        <h3 className="text-sm font-semibold tracking-[-0.02em]">Atividades</h3>
        <p className="text-xs text-muted-foreground">Timeline do dia</p>
      </div>
      <ul className="flex-1 overflow-y-auto px-5 py-4 md:px-6">
        {crmActivities.map((activity, i) => (
          <ActivityItem key={activity.id} activity={activity} index={i} />
        ))}
      </ul>
    </GlassCard>
  )
}
