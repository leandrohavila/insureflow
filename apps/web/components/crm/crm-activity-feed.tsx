"use client"

import { motion, useReducedMotion } from "framer-motion"
import { FileText, MessageSquare, Receipt } from "lucide-react"

import {
  formatCurrency,
  stageLabelMap,
  type CrmDeal,
} from "@/lib/data-access/modules/crm"
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

type CrmActivity = {
  id: string
  type: keyof typeof activityIcon
  title: string
  description: string
  time: string
  user: string
}

function formatRelativeTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  if (Number.isNaN(diffMs)) return "Agora"

  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return "Agora"
  if (minutes < 60) return `Há ${minutes}min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Há ${hours}h`

  const days = Math.floor(hours / 24)
  return `Há ${days}d`
}

function buildActivities(deals: CrmDeal[]): CrmActivity[] {
  return deals
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5)
    .map((deal) => ({
      id: deal.id,
      type: deal.value > 0 ? "value" : "created",
      title:
        deal.status === "won" ? `Negócio ganho — ${deal.title}` : deal.title,
      description: `${deal.company} · ${formatCurrency(deal.value)} · ${stageLabelMap[deal.stage]}`,
      time: formatRelativeTime(deal.updatedAt),
      user: deal.owner,
    }))
}

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
            activityColor[activity.type],
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
        <p className="mt-1.5 text-[10px] text-muted-foreground/70">
          {activity.user}
        </p>
      </div>
    </motion.li>
  )
}

export function CrmActivityFeed({ deals }: { deals: CrmDeal[] }) {
  const activities = buildActivities(deals)

  return (
    <GlassCard delay={0.2} hover={false} className="flex h-full flex-col p-0">
      <div className="border-b border-white/[0.06] px-5 py-4 md:px-6">
        <h3 className="text-sm font-semibold tracking-[-0.02em]">Atividades</h3>
        <p className="text-xs text-muted-foreground">Timeline do dia</p>
      </div>
      <ul className="flex-1 overflow-y-auto px-5 py-4 md:px-6">
        {activities.length === 0 ? (
          <li className="text-xs text-muted-foreground">
            Nenhuma atividade real registrada no pipeline.
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
