"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  Filter,
  Kanban,
  List,
  SlidersHorizontal,
  Upload,
} from "lucide-react"

import { CrmMetrics } from "@/components/crm/crm-metrics"
import { PipelineBoard } from "@/components/crm/pipeline-board"
import { CrmDealsList } from "@/components/crm/crm-deals-list"
import { CrmActivityFeed } from "@/components/crm/crm-activity-feed"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { DealFormDialog } from "@/components/crm/deal-form-dialog"
import { DealDetailSheet } from "@/components/crm/deal-detail-sheet"
import { ErrorState, LoadingState } from "@/components/shared"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/data-access"
import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import {
  useCreateCrmDeal,
  useCrmDeals,
  useUpdateCrmDeal,
} from "@/lib/data-access/modules/crm"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

type ViewMode = "board" | "list"
const EMPTY_DEALS: CrmDeal[] = []

export function DealsPage() {
  const [view, setView] = useState<ViewMode>("board")
  const [query, setQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const reduce = useReducedMotion()
  const dealsQuery = useCrmDeals()
  const createDeal = useCreateCrmDeal()
  const updateDeal = useUpdateCrmDeal()

  const deals = dealsQuery.data ?? EMPTY_DEALS
  const filteredDeals = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return deals
    return deals.filter((deal) =>
      [deal.title, deal.company, deal.assignedTo, deal.status, deal.stage]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [deals, query])

  const selectedDeal = selectedDealId
    ? (deals.find((deal) => deal.id === selectedDealId) ?? null)
    : null

  const handleDealSelect = (deal: CrmDeal) => {
    setSelectedDealId(deal.id)
  }

  const handleDealStageChange = (deal: CrmDeal, stage: CrmStageId) => {
    updateDeal.mutate({ id: deal.id, input: { stage } })
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:gap-10 md:px-8 md:py-10"
    >
      <CrmPageHeader
        badge="Pipeline comercial"
        title="Negócios"
        description="Funil visual de oportunidades — arraste entre estágios, filtre e acompanhe cada negócio em detalhe."
        primaryAction={{
          label: "Novo negócio",
          onClick: () => setCreateOpen(true),
        }}
      >
        <Link
          href="/crm"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2",
          )}
        >
          Visão geral
        </Link>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="size-3.5" strokeWidth={1.5} />
          Importar
        </Button>
      </CrmPageHeader>

      <CrmMetrics deals={deals} />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: easeOut }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <motion.div className="relative max-w-md flex-1">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Filtrar negócios, empresas ou contatos…"
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </motion.div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="size-3.5" strokeWidth={1.5} />
            Filtros
          </Button>
          <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                view === "board"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Kanban className="size-3.5" strokeWidth={1.5} />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                view === "list"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="size-3.5" strokeWidth={1.5} />
              Lista
            </button>
          </div>
        </div>
      </motion.div>

      {dealsQuery.isLoading ? (
        <LoadingState label="Carregando negócios do CRM…" />
      ) : dealsQuery.isError ? (
        <ErrorState
          title="Não foi possível carregar o CRM."
          description={getErrorMessage(
            dealsQuery.error,
            "Erro ao carregar negócios",
          )}
          onRetry={() => dealsQuery.refetch()}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:gap-8">
          <motion.div
            key={view}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="min-w-0"
          >
            {view === "board" ? (
              <PipelineBoard
                deals={filteredDeals}
                onDealSelect={handleDealSelect}
                onDealStageChange={handleDealStageChange}
              />
            ) : (
              <CrmDealsList
                deals={filteredDeals}
                onDealSelect={handleDealSelect}
              />
            )}
          </motion.div>
          <aside className="hidden xl:block">
            <motion.div className="sticky top-36">
              <CrmActivityFeed deals={deals} />
            </motion.div>
          </aside>
        </div>
      )}

      <div className="xl:hidden">
        <CrmActivityFeed deals={deals} />
      </div>

      <DealDetailSheet
        deal={selectedDeal}
        open={selectedDealId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null)
        }}
      />

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
