"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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
import { CRMRightSidebar } from "@/components/crm/crm-right-sidebar"
import { CRMRightSidebarToggle } from "@/components/crm/crm-right-sidebar-toggle"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { DealFormDialog } from "@/components/crm/deal-form-dialog"
import { DealDetailSheet } from "@/components/crm/deal-detail-sheet"
import { DealSheetV2 } from "@/components/crm/deal-sheet-v2"
import { PermissionGate } from "@/components/auth/permission-gate"
import { useCanManage } from "@/components/auth/session-provider"
import { ErrorState, LoadingState } from "@/components/shared"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/data-access"
import type { CrmDeal, DealPipelineUpdateInput } from "@/lib/data-access/modules/crm"
import {
  useCreateCrmDeal,
  useCrmDeals,
  useDeleteCrmDeal,
  useUpdateCrmDeal,
} from "@/lib/data-access/modules/crm"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useFocusReturn } from "@/lib/hooks/use-focus-return"
import { useCrmPersistedValue } from "@/lib/hooks/use-crm-workspace-preferences"
import { easeOut } from "@/lib/motion"
import { buildCrmReturnHref } from "@/lib/questionnaires/questionnaire-crm-navigation"
import { closeEntitySheetNavigation } from "@/lib/crm/entity-sheet-navigation"
import {
  CRM_FILTER_INPUT,
  CRM_PAGE_SHELL,
  CRM_PAGE_SHELL_SCROLL,
  CRM_TOOLBAR,
  crmViewToggleButton,
  CRM_VIEW_TOGGLE_WRAP,
} from "@/lib/crm/crm-layout-classes"
import { cn } from "@/lib/utils"

type ViewMode = "board" | "list"
const EMPTY_DEALS: CrmDeal[] = []
const SEARCH_DEBOUNCE_MS = 400

function isDealsView(value: string): value is ViewMode {
  return value === "board" || value === "list"
}

export function DealsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [persistedView, setPersistedView] = useCrmPersistedValue(
    "deals.view",
    isDealsView,
  )
  const view: ViewMode = isDealsView(persistedView) ? persistedView : "board"
  const setView = (next: ViewMode) => setPersistedView(next)
  const [queryInput, setQueryInput] = useState("")
  const query = useDebouncedValue(queryInput, SEARCH_DEBOUNCE_MS)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<CrmDeal | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const reduce = useReducedMotion()
  const canManageCrm = useCanManage("crm:view")
  const { captureFocus, restoreFocus } = useFocusReturn()
  const dealsQuery = useCrmDeals()
  const createDeal = useCreateCrmDeal()
  const updateDeal = useUpdateCrmDeal()
  const deleteDeal = useDeleteCrmDeal()

  const deals = dealsQuery.data ?? EMPTY_DEALS

  const syncDealParam = useCallback(
    (dealId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (dealId) {
        params.set("deal", dealId)
      } else {
        params.delete("deal")
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    const dealId = searchParams.get("deal")
    setSelectedDealId(dealId)
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get("create") !== "deal" || !canManageCrm) return
    setEditingDeal(null)
    setCreateOpen(true)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("create")
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [canManageCrm, pathname, router, searchParams])

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

  const buildCrmReturnHrefForDeal = useCallback(
    (dealId: string) => buildCrmReturnHref(dealId, searchParams.toString()),
    [searchParams],
  )

  const handleDealSelect = useCallback(
    (deal: CrmDeal) => {
      captureFocus()
      setSelectedDealId(deal.id)
      syncDealParam(deal.id)
    },
    [captureFocus, syncDealParam],
  )

  const handleDealMove = useCallback(
    async (deal: CrmDeal, update: DealPipelineUpdateInput) => {
      if (!canManageCrm) return
      await updateDeal.mutateAsync({
        id: deal.id,
        input: { stage: update.stage, pipelineOrder: update.pipelineOrder },
      })
    },
    [canManageCrm, updateDeal],
  )

  const handleDealEdit = (deal: CrmDeal) => {
    setSelectedDealId(null)
    syncDealParam(null)
    setEditingDeal(deal)
    setCreateOpen(true)
  }

  const handleDealDelete = (deal: CrmDeal) => {
    if (!window.confirm(`Excluir negócio ${deal.title}?`)) return
    deleteDeal.mutate(deal.id, {
      onSuccess: () => {
        if (selectedDealId === deal.id) {
          setSelectedDealId(null)
          syncDealParam(null)
        }
      },
    })
  }

  const dealsToolbar = (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: easeOut }}
      className={CRM_TOOLBAR}
    >
      <motion.div className="relative min-w-0 w-full flex-1 lg:max-w-sm">
        <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/45" />
        <Input
          placeholder="Filtrar negócios, empresas ou contatos…"
          className={CRM_FILTER_INPUT}
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
        />
      </motion.div>
      <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
        <CRMRightSidebarToggle />
        <Button variant="outline" size="sm" className="shrink-0 gap-2">
          <SlidersHorizontal className="size-3.5" strokeWidth={1.5} />
          Filtros
        </Button>
        <div className={CRM_VIEW_TOGGLE_WRAP}>
          <button
            type="button"
            onClick={() => setView("board")}
            className={crmViewToggleButton(view === "board")}
          >
            <Kanban className="size-3.5" strokeWidth={1.5} />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={crmViewToggleButton(view === "list")}
          >
            <List className="size-3.5" strokeWidth={1.5} />
            Lista
          </button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, ease: easeOut }}
      className={CRM_PAGE_SHELL}
    >
      <CrmPageHeader
        badge="Pipeline comercial"
        title="Negócios"
        description="Funil visual — arraste entre estágios e acompanhe cada negócio."
        compact
        primaryAction={
          canManageCrm
            ? {
                label: "Novo negócio",
                onClick: () => {
                  setEditingDeal(null)
                  setCreateOpen(true)
                },
              }
            : undefined
        }
      >
        <Link
          href="/crm"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 gap-2",
          )}
        >
          Visão geral
        </Link>
        <PermissionGate permission="crm:manage">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Upload className="size-3.5" strokeWidth={1.5} />
            Importar
          </Button>
        </PermissionGate>
      </CrmPageHeader>

      <CrmMetrics deals={deals} />

      <CRMRightSidebar
        className="min-h-0 flex-1"
        sidebar={<CrmActivityFeed deals={deals} />}
        header={dealsToolbar}
      >
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
          <motion.div
            key={view}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              view === "list"
                ? cn(CRM_PAGE_SHELL_SCROLL, "gap-0")
                : "overflow-hidden",
            )}
          >
            {view === "board" ? (
              <PipelineBoard
                deals={filteredDeals}
                interactive={canManageCrm}
                onDealSelect={handleDealSelect}
                onDealEdit={handleDealEdit}
                onDealDelete={handleDealDelete}
                onDealMove={handleDealMove}
              />
            ) : (
              <CrmDealsList
                deals={filteredDeals}
                onDealSelect={handleDealSelect}
                onDealEdit={handleDealEdit}
                onDealDelete={handleDealDelete}
                deletePending={deleteDeal.isPending}
                stickyHeader
              />
            )}
          </motion.div>
        )}
      </CRMRightSidebar>

      {/*
        Feature flag `?sheet=v2` — Fase 2.3.
        Ambos os sheets têm a mesma interface; o swap é puramente visual.
        DealDetailSheet legado permanece default; DealSheetV2 é opt-in para
        validação lado a lado sem afetar usuários ativos.
      */}
      {searchParams.get("sheet") === "v2" ? (
        <DealSheetV2
          deal={selectedDeal}
          open={selectedDealId !== null}
          crmReturnHref={
            selectedDeal
              ? buildCrmReturnHrefForDeal(selectedDeal.id)
              : undefined
          }
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDealId(null)
              closeEntitySheetNavigation({
                router,
                pathname,
                searchParams,
                entityType: "deal",
              })
              restoreFocus()
            }
          }}
        />
      ) : (
        <DealDetailSheet
          deal={selectedDeal}
          open={selectedDealId !== null}
          crmReturnHref={
            selectedDeal
              ? buildCrmReturnHrefForDeal(selectedDeal.id)
              : undefined
          }
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDealId(null)
              closeEntitySheetNavigation({
                router,
                pathname,
                searchParams,
                entityType: "deal",
              })
              restoreFocus()
            }
          }}
        />
      )}

      <DealFormDialog
        open={canManageCrm && createOpen}
        deal={editingDeal}
        pending={createDeal.isPending || updateDeal.isPending}
        error={createDeal.error ?? updateDeal.error}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) setEditingDeal(null)
        }}
        onSubmit={(input) => {
          if (editingDeal) {
            updateDeal.mutate(
              { id: editingDeal.id, input },
              {
                onSuccess: () => {
                  setCreateOpen(false)
                  setEditingDeal(null)
                },
              },
            )
            return
          }

          createDeal.mutate(input, {
            onSuccess: () => setCreateOpen(false),
          })
        }}
      />
    </motion.div>
  )
}
