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
import { CrmCaptureActions } from "@/components/crm/crm-capture-actions"
import { CrmDensityToggle } from "@/components/crm/interaction"
import { PipelineBoard } from "@/components/crm/pipeline-board"
import { PipelineConversionEmpty } from "@/components/crm/pipeline-conversion-empty"
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
  FilterSearch,
  OperationalPageLayout,
  OperationalWorkspaceMetrics,
  PageContainer,
  ErrorState,
  LoadingState,
} from "@/components/design-system"
import { Button } from "@/components/ui/button"
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
import { useBusinessUnitContext } from "@/lib/data-access/modules/business-units"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useFocusReturn } from "@/lib/hooks/use-focus-return"
import {
  useCrmPersistedValue,
  useCrmWorkspacePreferences,
} from "@/lib/hooks/use-crm-workspace-preferences"
import { resolvePipelineDensity } from "@/lib/crm/pipeline-density"
import { easeOut } from "@/lib/motion"
import { buildCrmReturnHref } from "@/lib/questionnaires/questionnaire-crm-navigation"
import { closeEntitySheetNavigation } from "@/lib/crm/entity-sheet-navigation"
import { CRM_PAGE_SHELL_SCROLL } from "@/lib/crm/crm-layout-classes"
import {
  CrmFilterChip,
  CrmFilterGroup,
  crmFilterChipClass,
} from "@/components/crm/crm-controls"
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
  const { density } = useCrmWorkspacePreferences()
  const pipelineDensity = resolvePipelineDensity(density)
  const reduce = useReducedMotion()
  const canManageCrm = useCanManage("crm:view")
  const { captureFocus, restoreFocus } = useFocusReturn()
  const dealsQuery = useCrmDeals()
  const pipelinesQuery = useCrmPipelines()
  const createDeal = useCreateCrmDeal()
  const unitContext = useBusinessUnitContext()
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

  const [moveError, setMoveError] = useState<string | null>(null)
  const refetchDeals = dealsQuery.refetch

  const handleDealMove = useCallback(
    async (deal: CrmDeal, update: DealPipelineUpdateInput) => {
      if (!canManageCrm) {
        const message = "Sem permissão para mover negócios no pipeline."
        setMoveError(message)
        throw new Error(message)
      }
      setMoveError(null)
      try {
        await updateDealPipeline.mutateAsync({
          id: deal.id,
          input: { stage: update.stage, pipelineOrder: update.pipelineOrder },
        })
      } catch (error) {
        setMoveError(
          getErrorMessage(error, "Não foi possível mover o negócio. Tente novamente."),
        )
        void refetchDeals()
        throw error
      }
    },
    [canManageCrm, refetchDeals, updateDealPipeline],
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
    <div
      className="rounded-xl border border-[#D6CFC4] bg-white p-3! text-[#10294B] shadow-[0_1px_2px_rgb(16_41_75/0.04)] [&_label>span]:text-[#5C6578]"
      role="toolbar"
      aria-label="Navegação e filtros do pipeline"
    >
      <div className="flex min-w-0 w-full flex-wrap items-center gap-x-[var(--if-layout-page-actions-gap)] gap-y-2">
      <CrmFilterGroup label="Navegação do pipeline">
        <Link href="/crm" className={crmFilterChipClass(false)}>
          Visão geral
        </Link>
        <CrmFilterChip pressed={view === "board"} onClick={() => setView("board")}>
          <Kanban className="size-3.5" strokeWidth={1.75} />
          Kanban
        </CrmFilterChip>
        <CrmFilterChip pressed={view === "list"} onClick={() => setView("list")}>
          <List className="size-3.5" strokeWidth={1.75} />
          Lista
        </CrmFilterChip>
      </CrmFilterGroup>
      <CrmFilterGroup label="Unidade de negócio">
        {(
          [
            ["all", "Todas"],
            ["INSURANCE", "Corretora"],
            ["REAL_ESTATE", "Imobiliária"],
          ] as const
        ).map(([id, label]) => (
          <CrmFilterChip
            key={id}
            pressed={unitFilter === id}
            onClick={() => setUnitFilter(id)}
          >
            {label}
          </CrmFilterChip>
        ))}
      </CrmFilterGroup>
      <FilterSearch
        label="Filtrar negócios"
        placeholder="Buscar negócios, clientes ou empresas…"
        value={queryInput}
        onChange={(event) => setQueryInput(event.target.value)}
        containerClassName="w-full min-w-[14rem] max-w-full basis-full sm:w-auto sm:max-w-[18rem] sm:basis-[16rem] sm:flex-1"
        className="h-9! border-[#D6CFC4]! bg-white! text-sm! text-[#10294B]! shadow-none placeholder:text-[#5C6578] dark:bg-white!"
      />
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
        <Button variant="crmSecondary" className="shrink-0">
          <SlidersHorizontal className="size-3.5" strokeWidth={1.75} />
          Filtros
        </Button>
        <CrmDensityToggle variant="chips" />
        <CRMRightSidebarToggle appearance="crm" />
      </div>
      </div>
    </div>
  )

  return (
    <PageContainer fillHeight className="avila-pipeline-surface">
      <ContentContainer variant={dsContentLayoutVariant.crmDeals}>
        <OperationalPageLayout density="dense">
          <header className="pipeline-masthead shrink-0">
            <div className="pipeline-masthead__title">
              <p className="pipeline-masthead__eyebrow">CRM</p>
              <h1>Pipeline Comercial</h1>
            </div>
            <CrmCaptureActions
              appearance="crm"
              insuranceLabel="Novo Lead Seguro"
              realEstateLabel="Novo Lead Imobiliário"
              dealLabel="Novo Negócio"
              onCreateDeal={() => {
                setEditingDeal(null)
                setCreateOpen(true)
              }}
              leading={
                <PermissionGate permission="crm:manage">
                  <Button variant="crmSecondary">
                    <Upload className="size-3.5" strokeWidth={1.75} />
                    Importar
                  </Button>
                </PermissionGate>
              }
            />
          </header>

          <OperationalWorkspaceMetrics className="pipeline-metrics">
            <CrmMetrics deals={deals} density={pipelineDensity.metricsDensity} />
          </OperationalWorkspaceMetrics>

          <CRMRightSidebar
            overlayBelowWide
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
            {!dealsQuery.isLoading && deals.length === 0 ? (
              <PipelineConversionEmpty dealCount={0} />
            ) : null}
            {moveError ? (
              <div
                role="alert"
                className="mb-2! flex shrink-0 items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3! py-2! text-sm text-destructive"
              >
                <span className="min-w-0">{moveError}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 text-destructive"
                  onClick={() => setMoveError(null)}
                >
                  Fechar
                </Button>
              </div>
            ) : null}
            {view === "board" ? (
              <PipelineBoard
                compact={pipelineDensity.compact}
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
                density={pipelineDensity.listDensity}
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
        businessUnitId={unitContext.data?.currentBusinessUnitId}
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
