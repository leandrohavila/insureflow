"use client"

import { useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  AlertCircle,
  Filter,
  Kanban,
  List,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/data-access"
import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import {
  pipelineStages,
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
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [deals, query])

  const selectedDeal = selectedDealId
    ? deals.find((deal) => deal.id === selectedDealId) ?? null
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
        primaryAction={{ label: "Novo negócio", onClick: () => setCreateOpen(true) }}
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

      {dealsQuery.isLoading ? (
        <div className="glass-panel flex min-h-[320px] items-center justify-center rounded-2xl">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando negócios do CRM…
          </div>
        </div>
      ) : dealsQuery.isError ? (
        <div className="glass-panel flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <div>
            <p className="font-medium text-foreground">Não foi possível carregar o CRM.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {getErrorMessage(dealsQuery.error, "Erro ao carregar negócios")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => dealsQuery.refetch()}>
            Tentar novamente
          </Button>
        </div>
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
            <CrmDealsList deals={filteredDeals} onDealSelect={handleDealSelect} />
          )}
        </motion.div>
        <aside className="hidden xl:block">
          <motion.div className="sticky top-36">
            <CrmActivityFeed />
          </motion.div>
        </aside>
      </div>
      )}

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

      <NewDealDialog
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

type NewDealForm = {
  title: string
  company: string
  value: string
  stage: CrmStageId
  assignedTo: string
}

function NewDealDialog({
  open,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  pending: boolean
  error: unknown
  onOpenChange: (open: boolean) => void
  onSubmit: (input: {
    title: string
    company: string
    value: number
    stage: CrmStageId
    status: "open"
    assignedTo?: string
  }) => void
}) {
  const [form, setForm] = useState<NewDealForm>({
    title: "",
    company: "",
    value: "",
    stage: "novo",
    assignedTo: "",
  })

  function update<K extends keyof NewDealForm>(key: K, value: NewDealForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(form.value)
    if (!form.title.trim() || !form.company.trim() || Number.isNaN(value)) return

    onSubmit({
      title: form.title.trim(),
      company: form.company.trim(),
      value,
      stage: form.stage,
      status: "open",
      assignedTo: form.assignedTo.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Novo negócio</DialogTitle>
            <DialogDescription>
              Crie uma oportunidade real no backend e atualize o pipeline automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Título</span>
              <Input
                required
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Ex.: Frota corporativa"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Empresa</span>
              <Input
                required
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
                placeholder="Ex.: Transportes Sul"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Valor</span>
              <Input
                required
                min={0}
                step="0.01"
                type="number"
                value={form.value}
                onChange={(event) => update("value", event.target.value)}
                placeholder="67000"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Estágio</span>
              <select
                value={form.stage}
                onChange={(event) => update("stage", event.target.value as CrmStageId)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {pipelineStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Responsável</span>
              <Input
                value={form.assignedTo}
                onChange={(event) => update("assignedTo", event.target.value)}
                placeholder="Ex.: Ana Costa"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar negócio")}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Salvar negócio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
