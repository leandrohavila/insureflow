"use client"

import { motion } from "framer-motion"
import { Percent, Target, Timer, TrendingUp, Wallet } from "lucide-react"

import { formatCurrency, type CrmDeal } from "@/lib/data-access/modules/crm"
import { GlassCard } from "@/components/dashboard/glass-card"
import { CRM_MUTED_LABEL } from "@/lib/crm/crm-layout-classes"
import { Stagger, StaggerItem } from "@/components/motion/primitives"
import { cn } from "@/lib/utils"

type CrmMetricsProps = {
  deals: CrmDeal[]
}

export function CrmMetrics({ deals }: CrmMetricsProps) {
  const openDeals = deals.filter((deal) => deal.status === "open")
  const wonDeals = deals.filter((deal) => deal.status === "won")
  const pipelineValue = openDeals.reduce((sum, deal) => sum + deal.value, 0)
  const totalDeals = openDeals.length
  const winRate =
    deals.length === 0 ? 0 : Math.round((wonDeals.length / deals.length) * 100)
  const avgDealValue =
    openDeals.length === 0 ? 0 : pipelineValue / openDeals.length

  const metrics = [
    {
      label: "Valor do pipeline",
      value: formatCurrency(pipelineValue),
      sub: "Negócios em aberto",
      icon: Wallet,
      accent: "from-primary/25 to-primary/5",
    },
    {
      label: "Negócios abertos",
      value: String(totalDeals),
      sub: `${deals.length} no banco`,
      icon: Target,
      accent: "from-violet-500/20 to-violet-600/5",
    },
    {
      label: "Taxa de conversão",
      value: `${winRate}%`,
      sub: "Pipeline atual",
      icon: Percent,
      accent: "from-emerald-500/15 to-emerald-600/5",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(avgDealValue),
      sub: "Em aberto",
      icon: Timer,
      accent: "from-amber-500/15 to-amber-600/5",
    },
  ] as const

  return (
    <Stagger className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m, i) => (
        <StaggerItem key={m.label}>
          <GlassCard delay={i * 0.03} className="p-0">
            <motion.div className="flex items-center gap-3 px-3.5 py-3">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-white/12",
                  m.accent,
                )}
              >
                <m.icon className="size-4 text-primary" strokeWidth={1.5} />
              </div>
              <motion.div className="min-w-0 flex-1">
                <p className={cn("truncate uppercase", CRM_MUTED_LABEL)}>
                  {m.label}
                </p>
                <p className="mt-0.5 truncate text-xl font-semibold tabular-nums tracking-tight text-foreground">
                  {m.value}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-foreground/55">
                  <TrendingUp
                    className="size-3 shrink-0 text-emerald-400"
                    strokeWidth={1.5}
                  />
                  {m.sub}
                </p>
              </motion.div>
            </motion.div>
          </GlassCard>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
