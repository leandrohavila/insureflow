"use client"

import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Calendar, CheckSquare, Filter, Plus } from "lucide-react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { GlassCard } from "@/components/dashboard/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  formatCurrency,
  useCrmDeals,
  type CrmDeal,
} from "@/lib/data-access/modules/crm"
import { easeOut } from "@/lib/motion"

const filters = ["Todas", "Hoje", "Atrasadas", "Concluídas"] as const

type CrmTask = {
  id: string
  title: string
  due: string
  dueLabel: "today" | "tomorrow" | "overdue" | "upcoming"
  priority: "alta" | "media" | "baixa"
  relatedTo: string
  owner: string
  ownerInitials: string
  completed: boolean
}

function taskFromDeal(deal: CrmDeal): CrmTask {
  const priority =
    deal.value >= 50000 ? "alta" : deal.value >= 15000 ? "media" : "baixa"

  return {
    id: deal.id,
    title:
      deal.status === "open"
        ? `Follow-up — ${deal.title}`
        : `Revisar histórico — ${deal.title}`,
    due: deal.status === "open" ? "Hoje" : "Agendada",
    dueLabel: deal.status === "open" ? "today" : "upcoming",
    priority,
    relatedTo: `${deal.company} · ${formatCurrency(deal.value)}`,
    owner: deal.owner,
    ownerInitials: deal.ownerInitials,
    completed: deal.status !== "open",
  }
}

const dueBadge: Record<CrmTask["dueLabel"], string> = {
  today: "Hoje",
  tomorrow: "Amanhã",
  overdue: "Atrasada",
  upcoming: "Agendada",
}

const dueClass: Record<CrmTask["dueLabel"], string> = {
  today: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  tomorrow: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  overdue: "border-rose-400/35 bg-rose-500/10 text-rose-200",
  upcoming: "border-white/15 bg-white/[0.04] text-muted-foreground",
}

const priorityDot = {
  alta: "bg-rose-400",
  media: "bg-amber-400",
  baixa: "bg-muted-foreground/50",
} as const

export function TasksPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todas")
  const reduce = useReducedMotion()
  const dealsQuery = useCrmDeals()
  const tasks = useMemo(
    () => (dealsQuery.data ?? []).map(taskFromDeal),
    [dealsQuery.data],
  )

  const filtered = tasks.filter((task) => {
    if (filter === "Concluídas") return task.completed
    if (filter === "Todas") return true
    if (filter === "Hoje") return task.dueLabel === "today" && !task.completed
    if (filter === "Atrasadas")
      return task.dueLabel === "overdue" && !task.completed
    return true
  })

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10"
    >
      <CrmPageHeader
        badge="Produtividade"
        title="Tarefas"
        description="Follow-ups, ligações e reuniões com prioridade e vínculo ao negócio relacionado."
        primaryAction={{ label: "Nova tarefa" }}
      />

      <motion.div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar tarefas…"
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      <GlassCard delay={0.1} className="divide-y divide-white/[0.06] p-0">
        {filtered.map((task, i) => (
          <motion.div
            key={task.id}
            initial={reduce ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: easeOut }}
            className={cn(
              "flex items-start gap-4 px-5 py-4 md:px-6",
              task.completed && "opacity-60",
            )}
          >
            <input
              type="checkbox"
              defaultChecked={task.completed}
              className="mt-1 size-4 rounded border-white/20"
              aria-label={`Concluir: ${task.title}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    priorityDot[task.priority],
                  )}
                  aria-hidden
                />
                <p
                  className={cn(
                    "text-[13px] font-medium leading-snug",
                    task.completed && "line-through",
                  )}
                >
                  {task.title}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Relacionado a: {task.relatedTo}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full text-[10px]",
                    dueClass[task.dueLabel],
                  )}
                >
                  {dueBadge[task.dueLabel]}
                </Badge>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="size-3" />
                  {task.due}
                </span>
              </div>
            </div>
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-primary/20 text-[10px] text-primary">
                {task.ownerInitials}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <CheckSquare className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa neste filtro.
            </p>
            <Button variant="outline" size="sm" className="mt-2 gap-1">
              <Plus className="size-3.5" />
              Criar tarefa
            </Button>
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}
