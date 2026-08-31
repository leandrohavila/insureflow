"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  Kanban,
  List,
  SlidersHorizontal,
  Upload,
} from "lucide-react"

import { CrmMetrics } from "@/components/crm/crm-metrics"
import { CrmPageHeaderActions } from "@/components/crm/crm-page-header-actions"
import { CrmCaptureActions } from "@/components/crm/crm-capture-actions"
import { PipelineBoard } from "@/components/crm/pipeline-board"
import { CrmDealsList } from "@/components/crm/crm-deals-list"
import { CrmActivityFeed } from "@/components/crm/crm-activity-feed"
import { CRMRightSidebar } from "@/components/crm/crm-right-sidebar"
import { CRMRightSidebarToggle } from "@/components/crm/crm-right-sidebar-toggle"
import { DealFormDialog } from "@/components/crm/deal-form-dialog"
import { DealSheetV2 } from "@/components/crm/deal-sheet-v2"
import { PermissionGate } from "@/components/auth/permission-gate"
import { useCanManage } from "@/components/auth/session-provider"
import {
  ContentContainer,
  FilterBar,
  FilterSearch,
  Inline,
  OperationalPageLayout,
  OperationalWorkspaceMetrics,
  PageContainer,
  PageHeader,
  ErrorState,
  LoadingState,
} from "@/components/design-system"
import { Button, buttonVariants } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/data-access"
import { dsContentLayoutVariant } from "@/lib/design-system"
import type { CrmDeal, CrmStageId, DealPipelineUpdateInput } from "@/lib/data-access/modules/crm"
import {
  pipelineStages,
  realEstatePipelineStages,
  useCreateCrmDeal,
  useCrmDeals,
  useCrmPipelines,
  useDeleteCrmDeal,
  useUpdateCrmDeal,
  useUpdateCrmDealPipeline,
} from "@/lib/data-access/modules/crm"
import { boardDealStage } from "@/lib/crm/deal-pipeline"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useFocusReturn } from "@/lib/hooks/use-focus-return"
import { useCrmPersistedValue } from "@/lib/hooks/use-crm-workspace-preferences"
import { easeOut } from "@/lib/motion"
import { buildCrmReturnHref } from "@/lib/questionnaires/questionnaire-crm-navigation"
import { closeEntitySheetNavigation } from "@/lib/crm/entity-sheet-navigation"
import {
  CRM_PAGE_SHELL_SCROLL,
  crmViewToggleButton,
  CRM_VIEW_TOGGLE_WRAP,
} from "@/lib/crm/crm-layout-classes"
import { cn } from "@/lib/utils"

type ViewMode = "board" | "list"
type PipelineUnitFilter = "all" | "INSURANCE" | "REAL_ESTATE"
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
  const [unitFilter, setUnitFilter] = useState<PipelineUnitFilter>("all")
  const [queryInput, setQueryInput] = useState("")
  const query = useDebouncedValue(queryInput, SEARCH_DEBOUNCE_MS)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<CrmDeal | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const reduce = useReducedMotion()
  const canManageCrm = useCanManage("crm:view")
  const { captureFocus, restoreFocus } = useFocusReturn()
  const dealsQuery = useCrmDeals()
  const pipelinesQuery = useCrmPipelines()
  const createDeal = useCreateCrmDeal()
  const updateDeal = useUpdateCrmDeal()
  const updateDealPipeline = useUpdateCrmDealPipeline()
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
    return deals.filter((deal) => {
      const unitType = deal.businessUnit?.type
      const matchesUnit =
        unitFilter === "all" ||
        (unitFilter === "REAL_ESTATE"
          ? unitType === "REAL_ESTATE"
          : unitType !== "REAL_ESTATE")
      if (!matchesUnit) return false
      if (!term) return true
      return [deal.title, deal.company, deal.assignedTo, deal.status, deal.stage]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
  }, [deals, query, unitFilter])

  const boardType =
    unitFilter === "REAL_ESTATE" ? "REAL_ESTATE" : "INSURANCE"
  const boardStages = useMemo(() => {
    const match = pipelinesQuery.data?.find(
      (pipeline) => pipeline.businessUnit.type === boardType,
    )
    if (match?.stages.length) {
      return match.stages.map((stage) => ({
        id: stage.slug as CrmStageId,
        label: stage.label,
        accent: stage.color ?? "primary",
      }))
    }
    return boardType === "REAL_ESTATE"
      ? realEstatePipelineStages
      : pipelineStages
  }, [boardType, pipelinesQuery.data])

  const boardDeals = useMemo(
    () =>
      filteredDeals.map((deal) => ({
        ...deal,
        stage: boardDealStage(deal.stage, deal.businessUnit?.type, boardType),
      })),
    [boardType, filteredDeals],
  )

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
      if (!canManageCrm) {
        throw new Error("Sem permissão para mover negócios no pipeline.")
      }
      await updateDealPipeline.mutateAsync({
        id: deal.id,
        input: { stage: update.stage, pipelineOrder: update.pipelineOrder },
      })
    },
    [canManageCrm, updateDealPipeline],
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
    <FilterBar>
      <FilterSearch
        label="Filtrar negócios"
        placeholder="Filtrar negócios, empresas ou contatos…"
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
      />
      <Inline wrap={false} className="shrink-0">
        {(
          [
            ["all", "Todas"],
            ["INSURANCE", "Corretora"],
            ["REAL_ESTATE", "Imobiliária"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setUnitFilter(id)}
            className={crmViewToggleButton(unitFilter === id)}
          >
            {label}
          </button>
        ))}
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
      </Inline>
    </FilterBar>
  )

  return (
    <PageContainer fillHeight>
      <ContentContainer variant={dsContentLayoutVariant.crmDeals}>
        <OperationalPageLayout density="dense">
          <PageHeader
            compact
            className="shrink-0"
            title="Negócios"
            actions={
              <CrmPageHeaderActions
                navigation={
                  <Link
                    href="/crm"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-9 gap-2",
                    )}
                  >
                    Visão geral
                  </Link>
                }
                primary={
                  <>
                    <PermissionGate permission="crm:manage">
                      <Button variant="outline" size="sm" className="h-8 gap-2">
                        <Upload className="size-3.5" strokeWidth={1.5} />
                        Importar
                      </Button>
                    </PermissionGate>
                    <CrmCaptureActions
                      onCreateDeal={() => {
                        setEditingDeal(null)
                        setCreateOpen(true)
                      }}
                    />
                  </>
                }
              />
            }
          />

          <OperationalWorkspaceMetrics>
            <CrmMetrics deals={deals} density="compact" />
          </OperationalWorkspaceMetrics>

          <CRMRightSidebar
        toolbarDense
        sidebar={<CrmActivityFeed />}
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
                : "h-full overflow-hidden",
            )}
          >
            {view === "board" ? (
              <PipelineBoard
                deals={boardDeals}
                stages={boardStages}
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
        </OperationalPageLayout>
      </ContentContainer>
    </PageContainer>
  )
}
