"use client"

import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  CalendarClock,
  Filter,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  StickyNote,
  Users,
} from "lucide-react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { GlassCard } from "@/components/dashboard/glass-card"
import { activityTypeLabels } from "@/lib/crm/activity-labels"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { getErrorMessage } from "@/lib/data-access"
import {
  useActivities,
  type ActivityType,
} from "@/lib/data-access/modules/activities"
import { CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL } from "@/lib/crm/crm-layout-classes"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

const SEARCH_DEBOUNCE_MS = 400

const activityIcons: Record<ActivityType, typeof Phone> = {
  call: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  meeting: Users,
  visit: MapPin,
  note: StickyNote,
  follow_up: CalendarClock,
}

const activityColor: Record<ActivityType, string> = {
  call: "bg-sky-500/15 text-sky-200 ring-sky-500/25",
  whatsapp: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  email: "bg-violet-500/15 text-violet-200 ring-violet-500/25",
  meeting: "bg-primary/15 text-primary ring-primary/25",
  visit: "bg-amber-500/15 text-amber-200 ring-amber-500/25",
  note: "bg-white/[0.06] text-muted-foreground ring-white/10",
  follow_up: "bg-amber-500/15 text-amber-200 ring-amber-500/25",
}

function formatTimelineDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

export function ActivitiesPage() {
  const reduce = useReducedMotion()
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const activitiesQuery = useActivities({ limit: 100 })

  const activities = useMemo(() => {
    const all = activitiesQuery.data?.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return all

    return all.filter((activity) =>
      [
        activity.subject,
        activity.description,
        activity.outcome,
        activity.performedBy.name,
        activityTypeLabels[activity.type],
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    )
  }, [activitiesQuery.data?.data, search])

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className={cn(CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL, "gap-8")}
    >
      <CrmPageHeader
        badge="Timeline"
        title="Atividades"
        description="Histórico operacional de interações humanas no relacionamento comercial."
      />

      <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Filtrar por assunto, descrição ou responsável…"
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        {activitiesQuery.isFetching ? (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Atualizando…
          </span>
        ) : null}
      </motion.div>

      {activitiesQuery.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(activitiesQuery.error, "Erro ao carregar atividades")}
        </p>
      ) : null}

      <GlassCard delay={0.1} className="p-5 md:p-6">
        {activitiesQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando timeline…
          </div>
        ) : (
          <ul className="relative space-y-0">
            <div
              aria-hidden
              className="absolute top-2 bottom-2 left-[19px] w-px bg-gradient-to-b from-primary/40 via-white/10 to-transparent"
            />
            {activities.map((activity, i) => {
              const Icon = activityIcons[activity.type] ?? activityIcons.note
              const typeLabel =
                activityTypeLabels[activity.type] ?? activityTypeLabels.note
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
                      activityColor[activity.type] ?? activityColor.note,
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.5} />
                  </motion.div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold tracking-[-0.02em]">
                        {activity.subject}
                      </p>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-muted-foreground">
                        {typeLabel}
                      </span>
                    </div>
                    {activity.description ? (
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {activity.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-muted-foreground/70">
                      {formatTimelineDate(activity.occurredAt)} ·{" "}
                      {activity.performedBy.name} ·{" "}
                      {formatLastInteraction(activity.occurredAt)}
                    </p>
                    {activity.nextFollowUpAt ? (
                      <p className="mt-1 text-[11px] text-amber-200/90">
                        Follow-up: {formatTimelineDate(activity.nextFollowUpAt)}
                      </p>
                    ) : null}
                  </div>
                </motion.li>
              )
            })}
            {activities.length === 0 && !activitiesQuery.isLoading ? (
              <li className="text-sm text-muted-foreground">
                Nenhuma atividade registrada. Registre interações nos negócios ou
                leads do CRM.
              </li>
            ) : null}
          </ul>
        )}
      </GlassCard>
    </motion.div>
  )
}
