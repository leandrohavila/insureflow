"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  AlertCircle,
  ArrowRight,
  Kanban,
  Loader2,
  Target,
  Trophy,
  Wallet,
} from "lucide-react"

import { CrmMetrics } from "@/components/crm/crm-metrics"
import { CrmActivityFeed } from "@/components/crm/crm-activity-feed"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { DealFormDialog } from "@/components/crm/deal-form-dialog"
import { PipelineBoard } from "@/components/crm/pipeline-board"
import { GlassCard } from "@/components/dashboard/glass-card"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  formatCurrency,
  pipelineStages,
  useCreateCrmDeal,
  useCrmDeals,
  type CrmDeal,
} from "@/lib/data-access/modules/crm"
import { getErrorMessage } from "@/lib/data-access"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

function getStageTotal(deals: CrmDeal[], stageId: CrmDeal["stage"]) {
  return deals
    .filter((deal) => deal.stage === stageId)
    .reduce((sum, deal) => sum + deal.value, 0)
}

export function CrmOverview() {
  const [createOpen, setCreateOpen] = useState(false)
  const reduce = useReducedMotion()
  const dealsQuery = useCrmDeals()
  const createDeal = useCreateCrmDeal()
  const deals = dealsQuery.data ?? []
  const openDeals = deals.filter((deal) => deal.status === "open")
  const wonDeals = deals.filter((deal) => deal.status === "won")
  const archivedDeals = deals.filter((deal) => deal.status === "archived")
  const pipelineValue = openDeals.reduce((sum, deal) => sum + deal.value, 0)

  const quickLinks = useMemo(
    () => [
      {
        href: "/crm/negocios",
        label: "Negócios",
        icon: Kanban,
        count: `${deals.length} no banco`,
      },
      {
        href: "/crm/negocios",
        label: "Pipeline aberto",
        icon: Wallet,
        count: formatCurrency(pipelineValue),
      },
      {
        href: "/crm/negocios",
        label: "Ganhos",
        icon: Trophy,
        count: `${wonDeals.length} negócios`,
      },
      {
        href: "/crm/negocios",
        label: "Arquivados",
        icon: Target,
        count: `${archivedDeals.length} registros`,
      },
    ],
    [archivedDeals.length, deals.length, pipelineValue, wonDeals.length],
  )

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
        description="Resumo executivo do pipeline, próximos negócios e atividades recentes com dados reais do backend."
        primaryAction={{
          label: "Novo negócio",
          onClick: () => setCreateOpen(true),
        }}
        secondaryAction={{ label: "Importar contatos" }}
      />

      {dealsQuery.isLoading ? (
        <div className="glass-panel flex min-h-[320px] items-center justify-center rounded-2xl">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando CRM real…
          </div>
        </div>
      ) : dealsQuery.isError ? (
        <div className="glass-panel flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <div>
            <p className="font-medium text-foreground">
              Não foi possível carregar o CRM.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {getErrorMessage(dealsQuery.error, "Erro ao carregar negócios")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dealsQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <CrmMetrics deals={deals} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link, i) => (
              <motion.div
                key={link.label}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.35, ease: easeOut }}
              >
                <Link
                  href={link.href}
                  className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:border-primary/25 hover:bg-white/[0.05]"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    <link.icon
                      className="size-4 text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold tracking-[-0.02em]">
                      {link.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {link.count}
                    </p>
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
                    <h2 className="text-sm font-semibold tracking-[-0.02em]">
                      Pipeline por estágio
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Valor agregado por coluna do funil
                    </p>
                  </motion.div>
                  <Link
                    href="/crm/negocios"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "gap-1 text-primary",
                    )}
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
                        {formatCurrency(getStageTotal(deals, stage.id))}
                      </p>
                    </div>
                  ))}
                </div>
                <PipelineBoard compact interactive={false} deals={deals} />
              </GlassCard>
            </div>

            <aside className="space-y-6">
              <GlassCard delay={0.12} className="p-5">
                <motion.div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-[-0.02em]">
                    Próximas ações
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Novo negócio"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Target className="size-3.5" />
                  </Button>
                </motion.div>
                <ul className="space-y-3">
                  {openDeals.length === 0 ? (
                    <li className="text-xs text-muted-foreground">
                      Nenhum negócio aberto no pipeline.
                    </li>
                  ) : (
                    openDeals.slice(0, 4).map((deal) => (
                      <li
                        key={deal.id}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                      >
                        <p className="text-[13px] font-medium leading-snug">
                          {deal.title}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {deal.company} · {formatCurrency(deal.value)}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
                <Link
                  href="/crm/negocios"
                  className={cn(
                    buttonVariants({ variant: "link", size: "sm" }),
                    "mt-3 h-auto p-0 text-primary",
                  )}
                >
                  Ver todos os negócios
                </Link>
              </GlassCard>

              <CrmActivityFeed deals={deals} />
            </aside>
          </motion.div>
        </>
      )}

      <DealFormDialog
        open={createOpen}
        pending={createDeal.isPending}
        error={createDeal.error}
        onOpenChange={setCreateOpen}
        onSubmit={(input) => {
          createDeal.mutate(input, {
            onSuccess: () => setCreateOpen(false),
          })
        }}
      />
    </motion.div>
  )
}
