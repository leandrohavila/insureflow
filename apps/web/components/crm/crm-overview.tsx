"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Building2,
  CheckSquare,
  Kanban,
  Plus,
  Users,
} from "lucide-react"

import { CrmMetrics } from "@/components/crm/crm-metrics"
import { CrmActivityFeed } from "@/components/crm/crm-activity-feed"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { PipelineBoard } from "@/components/crm/pipeline-board"
import { GlassCard } from "@/components/dashboard/glass-card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  crmTasks,
  formatCurrency,
  getStageTotal,
  pipelineStages,
} from "@/lib/crm-mock"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"
const quickLinks = [
  { href: "/crm/negocios", label: "Negócios", icon: Kanban, count: "42 abertos" },
  { href: "/crm/contatos", label: "Contatos", icon: Users, count: "6 registros" },
  { href: "/crm/empresas", label: "Empresas", icon: Building2, count: "6 contas" },
  { href: "/crm/tarefas", label: "Tarefas", icon: CheckSquare, count: "5 pendentes" },
] as const

export function CrmOverview() {
  const reduce = useReducedMotion()
  const todayTasks = crmTasks.filter((t) => !t.completed && t.dueLabel === "today")
  const overdueTasks = crmTasks.filter((t) => !t.completed && t.dueLabel === "overdue")

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:gap-10 md:px-8 md:py-10"
    >
      <CrmPageHeader
        badge="CRM Enterprise"
        title={
          <>
            <span className="text-gradient-brand">Visão geral</span>
          </>
        }
        description="Resumo executivo do pipeline, tarefas do dia e atividades recentes — experiência HubSpot para corretoras."
        primaryAction={{ label: "Novo negócio" }}
        secondaryAction={{ label: "Importar contatos" }}
      />

      <CrmMetrics />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link, i) => (
          <motion.div
            key={link.href}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35, ease: easeOut }}
          >
            <Link
              href={link.href}
              className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:border-primary/25 hover:bg-white/[0.05]"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <link.icon className="size-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-[-0.02em]">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.count}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: easeOut }}
        className="grid gap-6 xl:grid-cols-[1fr_320px]"
      >
        <div className="space-y-6">
          <GlassCard delay={0.1} className="p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <motion.div>
                <h2 className="text-sm font-semibold tracking-[-0.02em]">Pipeline por estágio</h2>
                <p className="text-xs text-muted-foreground">Valor agregado por coluna do funil</p>
              </motion.div>
              <Link
                href="/crm/negocios"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-primary")}
              >
                Ver funil
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {pipelineStages.map((stage) => (
                <div
                  key={stage.id}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                >
                  <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    {stage.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatCurrency(getStageTotal(stage.id))}
                  </p>
                </div>
              ))}
            </div>
            <PipelineBoard compact interactive={false} />
          </GlassCard>
        </div>

        <aside className="space-y-6">
          <GlassCard delay={0.12} className="p-5">
            <motion.div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-[-0.02em]">Tarefas de hoje</h2>
              <Button variant="ghost" size="icon-xs" aria-label="Nova tarefa">
                <Plus className="size-3.5" />
              </Button>
            </motion.div>
            <ul className="space-y-3">
              {todayTasks.length === 0 ? (
                <li className="text-xs text-muted-foreground">Nenhuma tarefa para hoje.</li>
              ) : (
                todayTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <input type="checkbox" className="mt-0.5 size-3.5 rounded border-white/20" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug">{task.title}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{task.due}</p>
                    </div>
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="bg-primary/20 text-[9px] text-primary">
                        {task.ownerInitials}
                      </AvatarFallback>
                    </Avatar>
                  </li>
                ))
              )}
            </ul>
            {overdueTasks.length > 0 && (
              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <p className="mb-2 text-[11px] font-semibold text-rose-300">Atrasadas</p>
                <ul className="space-y-2">
                  {overdueTasks.map((task) => (
                    <li key={task.id} className="text-xs text-muted-foreground">
                      {task.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href="/crm/tarefas"
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "mt-3 h-auto p-0 text-primary"
              )}
            >
              Ver todas as tarefas
            </Link>
          </GlassCard>

          <CrmActivityFeed />
        </aside>
      </motion.div>
    </motion.div>
  )
}
