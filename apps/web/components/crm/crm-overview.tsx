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
import { CRMRightSidebar } from "@/components/crm/crm-right-sidebar"
import { CRMRightSidebarToggle } from "@/components/crm/crm-right-sidebar-toggle"
import { CrmUpcomingActions } from "@/components/crm/crm-upcoming-actions"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { DealFormDialog } from "@/components/crm/deal-form-dialog"
import { PipelineBoard } from "@/components/crm/pipeline-board"
import { useCanManage } from "@/components/auth/session-provider"
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
import { CRM_PAGE_SHELL } from "@/lib/crm/crm-layout-classes"
import { cn } from "@/lib/utils"

function getStageTotal(deals: CrmDeal[], stageId: CrmDeal["stage"]) {
  return deals
    .filter((deal) => deal.stage === stageId)
    .reduce((sum, deal) => sum + deal.value, 0)
}

export function CrmOverview() {
  const [createOpen, setCreateOpen] = useState(false)
  const reduce = useReducedMotion()
  const canManageCrm = useCanManage("crm:view")
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
      className={CRM_PAGE_SHELL}
    >
      <CrmPageHeader
        badge="CRM Enterprise"
        title={
          <>
            <span className="text-gradient-brand">Visão geral</span>
          </>
        }
        description="Pipeline, próximos negócios e atividades recentes."
        compact
        primaryAction={
          canManageCrm
            ? {
                label: "Novo negócio",
                onClick: () => setCreateOpen(true),
              }
            : undefined
        }
        secondaryAction={
          canManageCrm ? { label: "Importar contatos" } : undefined
        }
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

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link, i) => (
              <motion.div
                key={link.label}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.35, ease: easeOut }}
              >
                <Link
                  href={link.href}
                  className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2.5 transition-all hover:border-primary/30 hover:bg-white/[0.06]"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/12 ring-1 ring-primary/25">
                    <link.icon
                      className="size-4 text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold tracking-tight">
                      {link.label}
                    </p>
                    <p className="text-sm text-foreground/60">
                      {link.count}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </motion.div>
            ))}
          </div>

          <CRMRightSidebar
            className="min-h-0 flex-1"
            sidebar={
              <>
                <CrmUpcomingActions
                  deals={deals}
                  onCreateDeal={() => setCreateOpen(true)}
                />
                <CrmActivityFeed deals={deals} />
              </>
            }
            header={
              <motion.div className="flex min-w-0 items-center justify-end gap-2">
                <CRMRightSidebarToggle />
              </motion.div>
            }
          >
              <GlassCard
                delay={0.1}
                className="flex min-h-0 min-w-0 flex-col overflow-hidden p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight">
                      Pipeline por estágio
                    </h2>
                    <p className="text-sm text-foreground/60">
                      Valor agregado por coluna do funil
                    </p>
                  </div>
                  <Link
                    href="/crm/negocios"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "shrink-0 gap-1 text-primary",
                    )}
                  >
                    Ver funil
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
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
                <div className="min-w-0 overflow-hidden">
                  <PipelineBoard compact interactive={false} deals={deals} />
                </div>
              </GlassCard>
          </CRMRightSidebar>
        </>
      )}

      <DealFormDialog
        open={canManageCrm && createOpen}
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
