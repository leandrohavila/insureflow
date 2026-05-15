"use client"

import { motion, useReducedMotion } from "framer-motion"
import {
  FileText,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Receipt,
} from "lucide-react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { GlassCard } from "@/components/dashboard/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CrmActivity } from "@/lib/crm-mock"
import { crmActivities } from "@/lib/crm-mock"
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

const typeLabel: Record<CrmActivity["type"], string> = {
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
  note: "Nota",
  quote: "Cotação",
}

export function ActivitiesPage() {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10"
    >
      <CrmPageHeader
        badge="Timeline"
        title="Atividades"
        description="Histórico unificado de ligações, e-mails, reuniões e cotações — visão HubSpot de engajamento."
        primaryAction={{ label: "Registrar atividade" }}
      />

      <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Filtrar atividades…"
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          Últimos 7 dias
        </Button>
      </motion.div>

      <GlassCard delay={0.1} className="p-5 md:p-6">
        <ul className="relative space-y-0">
          <div
            aria-hidden
            className="absolute top-2 bottom-2 left-[19px] w-px bg-gradient-to-b from-primary/40 via-white/10 to-transparent"
          />
          {crmActivities.map((activity, i) => {
            const Icon = activityIcon[activity.type]
            return (
              <motion.li
                key={activity.id}
                initial={reduce ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: easeOut }}
                className="relative flex gap-4 pb-8 last:pb-0"
              >
                <motion.div
                  className={cn(
                    "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
                    activityColor[activity.type]
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.5} />
                </motion.div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <motion.div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold tracking-[-0.02em]">{activity.title}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-muted-foreground">
                      {typeLabel[activity.type]}
                    </span>
                  </motion.div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground/70">
                    {activity.time} · {activity.user}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </ul>
      </GlassCard>
    </motion.div>
  )
}
