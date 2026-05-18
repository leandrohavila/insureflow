"use client"

import { motion } from "framer-motion"
import { Percent, Target, Timer, TrendingUp, Wallet } from "lucide-react"

import { formatCurrency, type CrmDeal } from "@/lib/data-access/modules/crm"
import { GlassCard } from "@/components/dashboard/glass-card"
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
      sub: `${deals.length} negócios no banco`,
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
      sub: "Negócios em aberto",
      icon: Timer,
      accent: "from-amber-500/15 to-amber-600/5",
    },
  ] as const

  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m, i) => (
        <StaggerItem key={m.label}>
          <GlassCard delay={i * 0.05} className="p-0">
            <motion.div className="flex items-start gap-4 p-5 md:p-6">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10",
                  m.accent,
                )}
              >
                <m.icon className="size-5 text-primary" strokeWidth={1.5} />
              </div>
              <motion.div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {m.label}
                </p>
                <p className="tabular-metric mt-1 text-2xl font-semibold text-foreground">
                  {m.value}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <TrendingUp
                    className="size-3 text-emerald-400/80"
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
