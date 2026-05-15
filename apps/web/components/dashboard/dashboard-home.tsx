"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Calendar, Download } from "lucide-react"

import { StatsCards } from "@/components/dashboard/stats-cards"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { RecentLeadsTable } from "@/components/dashboard/recent-leads-table"
import { GlassCard } from "@/components/dashboard/glass-card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const priorities = [
  {
    weight: "high",
    text: (
      <>
        Renovar <span className="font-medium text-foreground">12 apólices</span>{" "}
        corporativas em 30 dias.
      </>
    ),
  },
  {
    weight: "medium",
    text: (
      <>
        Follow-up de <span className="font-medium text-foreground">8 cotações</span>{" "}
        de frota.
      </>
    ),
  },
  {
    weight: "low",
    text: (
      <>
        Qualificar leads do canal{" "}
        <span className="font-medium text-foreground">WhatsApp</span>.
      </>
    ),
  },
] as const

export function DashboardHome() {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-10 px-4 py-8 md:gap-12 md:px-8 md:py-10 lg:gap-14 lg:px-10 lg:py-12"
    >
      <motion.header
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <motion.div className="max-w-2xl space-y-4">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.4, ease: easeOut }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-primary"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Visão executiva · Maio 2026
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] md:text-4xl lg:text-[2.5rem] lg:leading-[1.1]">
              <span className="text-gradient-brand">Dashboard</span>
            </h1>
            <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-base md:leading-relaxed">
              Métricas de carteira, pipeline e conversão — interface pensada para
              operações de seguros em escala enterprise.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: easeOut }}
          className="flex flex-wrap items-center gap-2"
        >
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="size-3.5" strokeWidth={1.5} />
            Últimos 30 dias
          </Button>
          <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
            <Download className="size-3.5" strokeWidth={1.5} />
            Exportar
          </Button>
        </motion.div>
      </motion.header>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <GlassCard
          delay={0.15}
          glow
          className="group/chart lg:col-span-8"
        >
          <div className="relative space-y-1 p-6 pb-2 md:p-8 md:pb-4">
            <h2 className="text-lg font-semibold tracking-[-0.03em]">
              Desempenho mensal
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Cotações vs. fechamentos · últimos 6 meses
            </p>
          </div>
          <motion.div
            className="px-4 pb-6 md:px-6 md:pb-8"
            initial={false}
          >
            <PerformanceChart />
          </motion.div>
        </GlassCard>

        <GlassCard delay={0.2} className="flex flex-col lg:col-span-4">
          <motion.div
            className="flex flex-1 flex-col p-6 md:p-8"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <div className="mb-6 space-y-1">
              <h2 className="text-lg font-semibold tracking-[-0.03em]">
                Foco da semana
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Prioridades comerciais
              </p>
            </div>

            <ul className="flex flex-1 flex-col gap-4">
              {priorities.map((item, i) => (
                <motion.li
                  key={i}
                  initial={reduce ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: easeOut }}
                  whileHover={reduce ? undefined : { x: 4 }}
                  className="flex gap-3 rounded-xl border border-transparent p-2 text-[13px] leading-relaxed text-muted-foreground transition-colors hover:border-white/[0.06] hover:bg-white/[0.03]"
                >
                  <span
                    className={cn(
                      "mt-2 size-1.5 shrink-0 rounded-full",
                      item.weight === "high" && "bg-primary shadow-[0_0_12px_var(--insure-glow)]",
                      item.weight === "medium" && "bg-primary/60",
                      item.weight === "low" && "bg-primary/35"
                    )}
                  />
                  <span>{item.text}</span>
                </motion.li>
              ))}
            </ul>

            <Separator className="my-6 bg-white/[0.06]" />
            <p className="text-xs leading-relaxed text-muted-foreground/80">
              Sincronize o funil com sinistros para priorizar contas de maior
              exposição.
            </p>
          </motion.div>
        </GlassCard>
      </div>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="space-y-5"
      >
        <motion.div
          className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between"
          initial={false}
        >
          <motion.div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">
              Leads recentes
            </h2>
            <p className="text-[13px] text-muted-foreground md:text-sm">
              Oportunidades com maior potencial de conversão
            </p>
          </motion.div>
        </motion.div>
        <RecentLeadsTable />
      </motion.section>
    </motion.div>
  )
}
