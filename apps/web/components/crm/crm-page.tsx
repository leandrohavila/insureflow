"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  Filter,
  Kanban,
  List,
  Plus,
  SlidersHorizontal,
  Upload,
} from "lucide-react"

import { CrmMetrics } from "@/components/crm/crm-metrics"
import { PipelineBoard } from "@/components/crm/pipeline-board"
import { CrmDealsList } from "@/components/crm/crm-deals-list"
import { CrmActivityFeed } from "@/components/crm/crm-activity-feed"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

type ViewMode = "board" | "list"

export function CrmPage() {
  const [view, setView] = useState<ViewMode>("board")
  const reduce = useReducedMotion()
  const dealsQuery = useCrmDeals()
  const deals = dealsQuery.data ?? []

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:gap-10 md:px-8 md:py-10 lg:px-10 lg:py-12"
    >
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easeOut }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold text-primary">
            Pipeline comercial
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
              <span className="text-gradient-brand">CRM</span>
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Gerencie leads, negócios e follow-ups em um funil visual — estilo
              HubSpot e Salesforce Lightning.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: easeOut }}
          className="flex flex-wrap items-center gap-2"
        >
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="size-3.5" strokeWidth={1.5} />
            Importar
          </Button>
          <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="size-3.5" strokeWidth={1.5} />
            Novo negócio
          </Button>
        </motion.div>
      </header>

      <CrmMetrics deals={deals} />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: easeOut }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative max-w-md flex-1">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Filtrar negócios, empresas ou contatos…"
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
          />
        </div>
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

      <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:gap-8">
        <motion.div
          key={view}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="min-w-0"
        >
          {view === "board" ? (
            <PipelineBoard deals={deals} />
          ) : (
            <CrmDealsList deals={deals} />
          )}
        </motion.div>
        <aside className="hidden xl:block">
          <div className="sticky top-20">
            <CrmActivityFeed deals={deals} />
          </div>
        </aside>
      </div>

      <div className="xl:hidden">
        <CrmActivityFeed deals={deals} />
      </div>
    </motion.div>
  )
}
