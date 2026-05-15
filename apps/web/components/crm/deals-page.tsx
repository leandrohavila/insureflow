"use client"

import { useState } from "react"
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
import { DealDetailSheet } from "@/components/crm/deal-detail-sheet"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CrmDeal } from "@/lib/crm-mock"
import { getDealById } from "@/lib/crm-mock"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

type ViewMode = "board" | "list"

export function DealsPage() {
  const [view, setView] = useState<ViewMode>("board")
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const reduce = useReducedMotion()

  const selectedDeal = selectedDealId ? getDealById(selectedDealId) ?? null : null

  const handleDealSelect = (deal: CrmDeal) => {
    setSelectedDealId(deal.id)
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
        primaryAction={{ label: "Novo negócio" }}
      >
        <Link
          href="/crm"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          Visão geral
        </Link>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="size-3.5" strokeWidth={1.5} />
          Importar
        </Button>
      </CrmPageHeader>

      <CrmMetrics />

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
                  : "text-muted-foreground hover:text-foreground"
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
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-3.5" strokeWidth={1.5} />
              Lista
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:gap-8">
        <motion.div
          key={view}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="min-w-0"
        >
          {view === "board" ? (
            <PipelineBoard onDealSelect={handleDealSelect} />
          ) : (
            <CrmDealsList onDealSelect={handleDealSelect} />
          )}
        </motion.div>
        <aside className="hidden xl:block">
          <motion.div className="sticky top-36">
            <CrmActivityFeed />
          </motion.div>
        </aside>
      </div>

      <div className="xl:hidden">
        <CrmActivityFeed />
      </div>

      <DealDetailSheet
        deal={selectedDeal}
        open={selectedDealId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null)
        }}
      />
    </motion.div>
  )
}
