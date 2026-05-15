"use client"

import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"

import { kpiStats } from "@/lib/dashboard-mock"
import { Stagger, StaggerItem } from "@/components/motion/primitives"
import { GlassCard } from "@/components/dashboard/glass-card"
import { cn } from "@/lib/utils"

const items = [
  {
    title: "Total de clientes",
    value: kpiStats.totalClientes.value,
    delta: kpiStats.totalClientes.delta,
    positive: kpiStats.totalClientes.positive,
    icon: Users,
    hint: "Base ativa · 30 dias",
    accent: "from-blue-500/20 to-blue-600/5",
  },
  {
    title: "Leads do mês",
    value: kpiStats.leadsMes.value,
    delta: kpiStats.leadsMes.delta,
    positive: kpiStats.leadsMes.positive,
    icon: UserPlus,
    hint: "Contatos qualificados",
    accent: "from-violet-500/20 to-violet-600/5",
  },
  {
    title: "Cotações em andamento",
    value: kpiStats.cotacoesAndamento.value,
    delta: kpiStats.cotacoesAndamento.delta,
    positive: kpiStats.cotacoesAndamento.positive,
    icon: FileSpreadsheet,
    hint: "Aguardando proposta",
    accent: "from-cyan-500/15 to-cyan-600/5",
  },
  {
    title: "Apólices ativas",
    value: kpiStats.apolicesAtivas.value,
    delta: kpiStats.apolicesAtivas.delta,
    positive: kpiStats.apolicesAtivas.positive,
    icon: Shield,
    hint: "Renovações · 90 dias",
    accent: "from-emerald-500/15 to-emerald-600/5",
  },
] as const

function AnimatedValue({ value }: { value: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.p
      className="tabular-metric text-[2rem] font-semibold text-foreground md:text-[2.125rem]"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {value}
    </motion.p>
  )
}

export function StatsCards() {
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
      {items.map((item, index) => (
        <StaggerItem key={item.title}>
          <GlassCard delay={index * 0.05} glow={index === 0} className="h-full p-0">
            <motion.div
              className="relative flex h-full flex-col p-5 md:p-6"
              whileHover={{ transition: { duration: 0.2 } }}
            >
              <motion.div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl",
                  item.accent
                )}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.div
                className="relative mb-5 flex items-start justify-between gap-3"
                initial={false}
              >
                <motion.div className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    {item.title}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10",
                    item.accent
                  )}
                >
                  <item.icon className="size-[19px] text-primary" strokeWidth={1.5} aria-hidden />
                </motion.div>
              </motion.div>

              <AnimatedValue value={item.value} />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <motion.span
                  layout
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ring-1",
                    item.positive
                      ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/25"
                      : "bg-amber-500/10 text-amber-400 ring-amber-500/25"
                  )}
                >
                  {item.positive ? (
                    <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
                  ) : (
                    <ArrowDownRight className="size-3.5" strokeWidth={2} aria-hidden />
                  )}
                  {item.delta}
                </motion.span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                  <TrendingUp className="size-3 opacity-60" strokeWidth={1.5} />
                  vs. mês anterior
                </span>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/75">
                {item.hint}
              </p>
            </motion.div>
          </GlassCard>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
