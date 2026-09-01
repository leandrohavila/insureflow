"use client"

import {
  Profiler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRightLeft,
  ClipboardList,
  Edit3,
  ExternalLink,
  Mail,
  Phone,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import {
  useCanManage,
  useShowMineLeadsFilter,
} from "@/components/auth/session-provider"
import { ConvertLeadDialog } from "@/components/leads/convert-lead-dialog"
import { LeadCreateEmptyActions, LeadCreateMenu } from "@/components/leads/lead-create-menu"
import { LeadCaptureMetricsGrid } from "@/components/leads/lead-capture-metrics"
import { LeadDialog } from "@/components/leads/lead-dialog"
import { LeadSheetV2 } from "@/components/leads/lead-sheet-v2"
import { QuestionnaireSubmissionDetailSheet } from "@/components/questionnaires/questionnaire-submission-detail-sheet"
import { QuestionnaireSubmissionDialog } from "@/components/questionnaires/questionnaire-submission-dialog"
import { ActionToast } from "@/components/shared"
import {
  ContentContainer,
  DataTable,
  FilterBar,
  FilterSearch,
  FilterSelect,
  OperationalPageLayout,
  OperationalWorkspace,
  OperationalWorkspaceMain,
  OperationalWorkspaceMetrics,
  OperationalWorkspaceToolbar,
  PageContainer,
  PageHeader,
  PageActions,
  PageActionsGroup,
  type DataTableColumn,
} from "@/components/design-system"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/data-access"
import { queryKeys } from "@/lib/data-access/query-keys"
import type {
  Lead,
  LeadListFilters,
  LeadStatus,
} from "@/lib/data-access/modules/leads"
import {
  fetchLead,
  LEAD_STATUSES,
  useConvertLead,
  useCreateLead,
  useDeleteLead,
  useLeads,
  useUpdateLead,
} from "@/lib/data-access/modules/leads"
import { shouldShowPageLeadSaveError } from "@/lib/data-access/modules/leads/lead-dialog-form"
import { resetLeadSaveMutations } from "@/lib/data-access/modules/leads/lead-dialog-mutations"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import { useLeadCaptureMetrics } from "@/lib/leads/use-lead-capture-metrics"
import {
  defaultInterestsForLeadIntent,
  leadIntentFromUnitType,
  parseLeadCreateIntent,
  type LeadCreateIntent,
} from "@/lib/leads/lead-intent"
import {
  INTEREST_CATEGORIES,
  INTEREST_CATEGORY_LABELS,
  type InterestCategory,
} from "@/lib/business-units/constants"
import { closeEntitySheetNavigation } from "@/lib/crm/entity-sheet-navigation"
import { dsContentLayoutVariant } from "@/lib/design-system"
import { isLeadConverted, leadOwnerDisplayName } from "@/lib/leads/lead-owner"
import {
  deriveLeadPriority,
  LEAD_PRIORITY_LABEL,
  leadHasNoContact,
} from "@/lib/leads/lead-operational-signals"
import {
  bug010LeadCreateLog,
  bug010LeadCreateProfiler,
  bug010LeadCreateStart,
} from "@/lib/performance/bug010-lead-create"
import {
  bug010DrawerLog,
  bug010DrawerResetFlow,
  bug010DrawerSetState,
} from "@/lib/performance/bug010-drawer-flow"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 400

function createLeadIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `lead-create-${crypto.randomUUID()}`
  }

  return `lead-create-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const statusLabels: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
}

const statusStyles: Record<LeadStatus, string> = {
  new: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  contacted: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  qualified: "border-primary/35 bg-primary/15 text-primary-foreground",
  converted: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  lost: "border-rose-400/35 bg-rose-500/10 text-rose-200",
}

function BusinessUnitFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { data: units = [] } = useBusinessUnits()
  return (
    <FilterSelect
      label="Empresa"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={[
        { value: "all", label: "Todas as empresas" },
        ...units.map((unit) => ({ value: unit.id, label: unit.name })),
      ]}
    />
  )
}

export function LeadsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const [status, setStatus] = useState<LeadStatus | "all">("all")
  const [source, setSource] = useState("")
  const [businessUnitId, setBusinessUnitId] = useState("all")
  const [interestCategory, setInterestCategory] = useState<
    InterestCategory | "all"
  >("all")
  const [mineOnly, setMineOnly] = useState(false)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [questionnaireLead, setQuestionnaireLead] = useState<Lead | null>(null)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null)
  const [convertToastDealId, setConvertToastDealId] = useState<string | null>(
    null,
  )
  const [leadCreateToast, setLeadCreateToast] = useState<string | null>(null)
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null)
  const createSubmitLockRef = useRef(false)
  const createIdempotencyKeyRef = useRef<string | null>(null)
  const dialogOpenRef = useRef(dialogOpen)
  const leadDialogSubmitLockedRef = useRef(false)
  const leadCreatePerfRef = useRef<{
    traceId: string
    submitStartedAt: number
  } | null>(null)
  const previousDialogOpenRef = useRef(dialogOpen)
  const convertSubmitLockRef = useRef(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  // Quando o flag ?sheet=v2 está ON e o usuário clica "Editar dados do lead"
  // dentro do LeadSheetV2 (que é leitura-primeiro), forçamos o fallback para o
  // LeadDialog legado. Isso evita criar formulário inline (fora do escopo) e
  // garante paridade funcional com o fluxo atual.
  const [createIntent, setCreateIntent] =
    useState<LeadCreateIntent>("insurance")
  const defaultInterestCategories = useMemo(
    () => defaultInterestsForLeadIntent(createIntent),
    [createIntent],
  )
  const [forceLegacyForm, setForceLegacyForm] = useState(false)
  const canManageLeads = useCanManage("leads:view")
  const canManageQuestionnaires = useCanManage("questionnaires:view")
  const showMineFilter = useShowMineLeadsFilter()
  // Feature flag de rollout do LeadSheetV2 — espelho de `?sheet=v2` do
  // `DealsPage`. Default = legado, opt-in via querystring. Quando OFF, o
  // sheet v2 nem é montado, garantindo zero impacto sobre usuários atuais.
  const isLeadSheetV2 = searchParams.get("sheet") === "v2"

  const filters = useMemo<LeadListFilters>(
    () => ({
      search,
      status,
      source,
      mine: mineOnly,
      businessUnitId: businessUnitId === "all" ? undefined : businessUnitId,
      interestCategory:
        interestCategory === "all" ? undefined : interestCategory,
      page,
      limit: PAGE_SIZE,
    }),
    [businessUnitId, interestCategory, mineOnly, page, search, source, status],
  )

  const leadsQuery = useLeads(filters)
  const captureMetrics = useLeadCaptureMetrics()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead(filters)
  const deleteLead = useDeleteLead(filters)
  const convertLead = useConvertLead(filters)
  const createLeadResetRef = useRef(createLead.reset)
  const updateLeadResetRef = useRef(updateLead.reset)

  useEffect(() => {
    dialogOpenRef.current = dialogOpen
    bug010DrawerSetState({ dialogOpen })
  }, [dialogOpen])

  useEffect(() => {
    createLeadResetRef.current = createLead.reset
    updateLeadResetRef.current = updateLead.reset
  }, [createLead.reset, updateLead.reset])

  useEffect(() => {
    return () => {
      createLeadResetRef.current()
      updateLeadResetRef.current()
    }
  }, [])

  const resetLeadSaveMutationsState = useCallback((caller = "unknown") => {
    bug010DrawerLog(`resetLeadSaveMutationsState(${caller})`, {
      status: createLead.status,
      isPending: createLead.isPending,
    })
    console.log("[RESET] caller =", caller)
    console.log("[RESET] createLead.reset() chamado")
    console.log("[RESET] mutation.status", createLead.status)
    console.log("[RESET] mutation.isPending", createLead.isPending)
    console.log("[RESET] dialogOpen", dialogOpenRef.current)
    console.log("[RESET] submitLocked", leadDialogSubmitLockedRef.current)
    resetLeadSaveMutations(createLead, updateLead)
  }, [createLead, updateLead])

  const openLeadDialog = useCallback(
    (lead: Lead | null = null, intent?: LeadCreateIntent) => {
      resetLeadSaveMutationsState("openLeadDialog")
      if (!lead) {
        createSubmitLockRef.current = false
        createIdempotencyKeyRef.current = null
        setCreateIntent(intent ?? "insurance")
      } else {
        setCreateIntent(leadIntentFromUnitType(lead.businessUnit?.type))
      }
      setEditingLead(lead)
      setDialogOpen(true)
    },
    [resetLeadSaveMutationsState],
  )

  useEffect(() => {
    console.log("[DRAWER] dialogOpen =", dialogOpen)
    bug010DrawerLog("dialogOpen effect", {
      status: createLead.status,
      isPending: createLead.isPending,
    })
  }, [dialogOpen])

  useEffect(() => {
    console.log("[DRAWER] mutation.isPending =", createLead.isPending)
    bug010DrawerSetState({
      status: createLead.status,
      isPending: createLead.isPending,
    })
    bug010DrawerLog("mutation state effect", {
      status: createLead.status,
      isPending: createLead.isPending,
    })
  }, [createLead.isPending])

  useEffect(() => {
    if (
      previousDialogOpenRef.current &&
      !dialogOpen &&
      leadCreatePerfRef.current
    ) {
      bug010LeadCreateLog(
        "Modal fechado/render aplicado",
        {
          totalSinceSubmitMs: Number(
            (
              performance.now() - leadCreatePerfRef.current.submitStartedAt
            ).toFixed(2),
          ),
        },
        leadCreatePerfRef.current.traceId,
      )
      leadCreatePerfRef.current = null
    }
    previousDialogOpenRef.current = dialogOpen
  }, [dialogOpen])

  const showPageLeadSaveError = shouldShowPageLeadSaveError(
    dialogOpen,
    Boolean(createLead.error || updateLead.error),
  )
  const pageLeadError = showPageLeadSaveError
    ? (createLead.error ?? updateLead.error)
    : convertLead.error

  const syncLeadUrlParams = useCallback(
    (updates: { lead?: string | null; convert?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (updates.lead !== undefined) {
        if (updates.lead) params.set("lead", updates.lead)
        else params.delete("lead")
      }
      if (updates.convert !== undefined) {
        if (updates.convert) params.set("convert", updates.convert)
        else params.delete("convert")
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const closeConvertDialog = useCallback(() => {
    setConvertTarget(null)
    setDialogOpen(false)
    setEditingLead(null)
    setForceLegacyForm(false)
    syncLeadUrlParams({ lead: null, convert: null })
  }, [syncLeadUrlParams])

  const openConvertDialog = useCallback(
    (lead: Lead) => {
      // Fechamos o sheet/dialog ANTES de abrir o ConvertLeadDialog para evitar
      // stacking de portais (dois Sheets/Dialogs no mesmo eixo lateral). Mesmo
      // padrão usado pelo fluxo legado — apenas inclui o reset do flag local.
      setDialogOpen(false)
      setEditingLead(null)
      setForceLegacyForm(false)
      setConvertTarget(lead)
      syncLeadUrlParams({ lead: null, convert: lead.id })
    },
    [syncLeadUrlParams],
  )

  const createQueryHandledRef = useRef<string | null>(null)

  useEffect(() => {
    const raw = searchParams.get("create")
    const intent = parseLeadCreateIntent(raw)
    if (!intent || !canManageLeads) return
    if (createQueryHandledRef.current === raw) return
    createQueryHandledRef.current = raw
    openLeadDialog(null, intent)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("create")
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [canManageLeads, openLeadDialog, pathname, router, searchParams])

  useEffect(() => {
    const convertId = searchParams.get("convert")
    const leadId = searchParams.get("lead")
    const deepLinkId = convertId ?? leadId
    if (!deepLinkId) return

    let cancelled = false
    void fetchLead(deepLinkId)
      .then((lead) => {
        if (cancelled) return
        if (convertId) {
          if (lead.status === "converted") {
            syncLeadUrlParams({ lead: null, convert: null })
            return
          }
          setConvertTarget(lead)
          setDialogOpen(false)
          setEditingLead(null)
          return
        }
        openLeadDialog(lead)
      })
      .catch(() => {
        // lead inexistente ou sem permissão — ignorar
      })

    return () => {
      cancelled = true
    }
  }, [openLeadDialog, searchParams, syncLeadUrlParams])

  const leads = leadsQuery.data?.data ?? []
  const meta = leadsQuery.data?.meta
  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (source.trim() ? 1 : 0) +
    (businessUnitId !== "all" ? 1 : 0) +
    (interestCategory !== "all" ? 1 : 0) +
    (mineOnly ? 1 : 0)

  useEffect(() => {
    if (!showMineFilter && mineOnly) {
      setMineOnly(false)
    }
  }, [mineOnly, showMineFilter])

  useEffect(() => {
    setPage(1)
  }, [businessUnitId, interestCategory, mineOnly, search, source, status])

  async function openLeadById(id: string) {
    const lead = await queryClient.fetchQuery({
      queryKey: queryKeys.leads.detail(id),
      queryFn: () => fetchLead(id),
    })
    openLeadDialog(lead)
  }

  const columns = useMemo<DataTableColumn<Lead>[]>(
    () => [
      {
        key: "name",
        header: "Lead",
        render: (row) => {
          const priority = deriveLeadPriority(row)
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-7 border border-white/10">
                <AvatarFallback className="bg-white/[0.06] text-[10px] font-semibold text-foreground">
                  {row.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-medium tracking-[-0.02em]">
                  {row.name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-px text-[10px] font-medium",
                      priority === "high" &&
                        "border-rose-400/30 bg-rose-500/10 text-rose-200",
                      priority === "medium" &&
                        "border-amber-400/30 bg-amber-500/10 text-amber-200",
                      priority === "low" &&
                        "border-white/10 text-muted-foreground",
                    )}
                  >
                    {LEAD_PRIORITY_LABEL[priority]}
                  </span>
                  {leadHasNoContact(row) ? (
                    <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-1.5 py-px text-[10px] text-sky-200">
                      Sem contato
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        key: "contact",
        header: "Contato",
        render: (row) => (
          <div className="flex flex-col gap-0 text-[11px] leading-tight text-muted-foreground">
            {row.email ? (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3 opacity-60" />
                {row.email}
              </span>
            ) : null}
            {row.phone ? (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3 opacity-60" />
                {row.phone}
              </span>
            ) : null}
            {!row.email && !row.phone ? "Sem contato" : null}
          </div>
        ),
      },
      {
        key: "source",
        header: "Origem",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.source || "Não informada"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full text-[10px] font-semibold",
              statusStyles[row.status],
            )}
          >
            {statusLabels[row.status]}
          </Badge>
        ),
      },
      {
        key: "owner",
        header: "Responsável",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {leadOwnerDisplayName(row) || "Sem responsável"}
          </span>
        ),
      },
      {
        key: "nextContact",
        header: "Próximo contato",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {leadHasNoContact(row)
              ? "Pendente"
              : formatLastInteraction(row.lastContactAt)}
          </span>
        ),
      },
      {
        key: "lastInteraction",
        header: "Última interação",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatLastInteraction(row.lastInteractionAt ?? row.lastContactAt)}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <PageContainer fillHeight>
      <ContentContainer variant={dsContentLayoutVariant.leads}>
        <OperationalPageLayout density="dense">
          <PageHeader
            compact
            className="shrink-0"
            title={
              <span className="inline-flex items-center gap-2">
                Leads
                <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
                  {meta?.total ?? leads.length}
                </Badge>
              </span>
            }
            description="Fila comercial única — priorize contato, follow-up e conversão."
            actions={
              <PageActions>
                <PageActionsGroup
                  variant="primary"
                  aria-label="Ações principais"
                >
                  <PermissionGate permission="leads:manage">
                    <LeadCreateMenu
                      onCreate={(intent) => openLeadDialog(null, intent)}
                      insuranceEnabled={
                        captureMetrics.isLoading ||
                        Boolean(captureMetrics.insuranceBusinessUnitId)
                      }
                      realEstateEnabled={
                        captureMetrics.isLoading ||
                        Boolean(captureMetrics.realEstateBusinessUnitId)
                      }
                    />
                  </PermissionGate>
                  <PermissionGate permission="leads:manage">
                    <Button variant="outline" size="sm" className="h-8 gap-1.5">
                      <Upload className="size-3.5" strokeWidth={1.5} />
                      Importar
                    </Button>
                  </PermissionGate>
                </PageActionsGroup>
              </PageActions>
            }
          />

          <OperationalWorkspaceMetrics>
            <Profiler
              id="BUG010.1 Lead cards"
              onRender={bug010LeadCreateProfiler("cards")}
            >
              <LeadCaptureMetricsGrid
                metrics={captureMetrics.metrics}
                loading={captureMetrics.isLoading}
              />
            </Profiler>
          </OperationalWorkspaceMetrics>

          <OperationalWorkspace>
            <OperationalWorkspaceToolbar dense>
            <FilterBar
              activeCount={activeFilterCount}
              clearLabel="Limpar filtros"
              onClear={() => {
                setSearchInput("")
                setStatus("all")
                setSource("")
                setBusinessUnitId("all")
                setInterestCategory("all")
                setMineOnly(false)
              }}
            >
              <FilterSearch
                label="Buscar leads"
                placeholder="Buscar por nome, empresa, contato, origem ou responsável…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <FilterSelect
                label="Status do lead"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as LeadStatus | "all")
                }
                options={[
                  { value: "all", label: "Todos os status" },
                  ...LEAD_STATUSES.map((item) => ({
                    value: item,
                    label: statusLabels[item],
                  })),
                ]}
              />
              <FilterSearch
                label="Origem"
                grow={false}
                containerClassName="w-36"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="Origem"
              />
              <BusinessUnitFilter
                value={businessUnitId}
                onChange={setBusinessUnitId}
              />
              <FilterSelect
                label="Interesse"
                value={interestCategory}
                onChange={(event) =>
                  setInterestCategory(
                    event.target.value as InterestCategory | "all",
                  )
                }
                options={[
                  { value: "all", label: "Todos os interesses" },
                  ...INTEREST_CATEGORIES.map((item) => ({
                    value: item,
                    label: INTEREST_CATEGORY_LABELS[item],
                  })),
                ]}
              />
              {showMineFilter ? (
                <label className="flex h-[var(--if-control-height-md)] shrink-0 cursor-pointer items-center gap-[var(--if-space-2)] rounded-[var(--if-radius-md)] border border-input/80 bg-input/25 px-[var(--if-space-3)] text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-3.5 accent-primary"
                    checked={mineOnly}
                    onChange={(event) => setMineOnly(event.target.checked)}
                  />
                  Responsável
                </label>
              ) : null}
            </FilterBar>
            </OperationalWorkspaceToolbar>

            <OperationalWorkspaceMain>
            <DataTable
              stickyHeader
              density="compact"
              className="w-full"
              data={leads}
              columns={columns}
              getRowId={(row) => row.id}
              selectable
              loading={leadsQuery.isLoading}
              loadingLabel="Carregando leads…"
              error={leadsQuery.isError ? leadsQuery.error : null}
              errorTitle="Não foi possível carregar leads."
              onRetry={() => leadsQuery.refetch()}
              emptyIcon={UserPlus}
              emptyTitle="Nenhum registro encontrado"
              emptyDescription="Crie um novo lead para começar — a unidade é definida pelo tipo (seguro ou imobiliário)."
              emptyAction={
                <PermissionGate permission="leads:manage">
                  <LeadCreateEmptyActions
                    onCreate={(intent) => openLeadDialog(null, intent)}
                    insuranceEnabled={
                      captureMetrics.isLoading ||
                      Boolean(captureMetrics.insuranceBusinessUnitId)
                    }
                    realEstateEnabled={
                      captureMetrics.isLoading ||
                      Boolean(captureMetrics.realEstateBusinessUnitId)
                    }
                  />
                </PermissionGate>
              }
              onRowClick={
                canManageLeads
                  ? (row) => {
                      openLeadDialog(row)
                    }
                  : undefined
              }
              rowActions={[
                {
                  key: "open-deal",
                  label: "Abrir negócio",
                  icon: ExternalLink,
                  disabled: (row) => !row.dealId,
                  permission: "crm:view",
                  onSelect: (row) => {
                    if (row.dealId) {
                      router.push(`/crm/negocios?deal=${row.dealId}`)
                    }
                  },
                },
                {
                  key: "questionnaire",
                  label: "Preencher questionário",
                  icon: ClipboardList,
                  permission: "questionnaires:manage",
                  onSelect: (row) => setQuestionnaireLead(row),
                },
                {
                  key: "convert",
                  label: "Converter em negócio",
                  icon: ArrowRightLeft,
                  disabled: (row) =>
                    row.status === "converted" || convertLead.isPending,
                  permission: "leads:manage",
                  onSelect: (row) => openConvertDialog(row),
                },
                {
                  key: "edit",
                  label: "Editar lead",
                  icon: Edit3,
                  permission: "leads:manage",
                  onSelect: (row) => {
                    openLeadDialog(row)
                  },
                },
                {
                  key: "delete",
                  label: "Excluir lead",
                  icon: Trash2,
                  variant: "destructive",
                  disabled: deleteLead.isPending,
                  hidden: (row) => isLeadConverted(row),
                  permission: "leads:manage",
                  onSelect: (row) => {
                    if (isLeadConverted(row)) return
                    if (window.confirm(`Excluir lead ${row.name}?`)) {
                      deleteLead.mutate(row.id)
                    }
                  },
                },
              ]}
              pagination={{
                meta: {
                  page: meta?.page ?? page,
                  totalPages: meta?.totalPages ?? 1,
                  total: meta?.total,
                },
                onPageChange: setPage,
              }}
            />
            </OperationalWorkspaceMain>
          </OperationalWorkspace>

          {pageLeadError ? (
            <p className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(pageLeadError, "Erro ao processar lead")}
            </p>
          ) : null}

          {/*
        Dual-render do detalhe/edição do lead (Fase L5 — LeadSheetV2):

        Sem flag (default):
        - `LeadDialog` lida com TUDO (criar, ver detalhes, editar campos).

        Com `?sheet=v2`:
        - `LeadSheetV2` lida com leitura + ações operacionais (timeline,
          questionário, conversão).
        - `LeadDialog` permanece montado mas só "abre" quando:
            (a) é criação (`editingLead === null`); OU
            (b) o usuário clicou "Editar dados do lead" dentro do sheet,
                forçando o fallback via `forceLegacyForm`.
        Isso garante zero alteração no caminho de criação/edição de campos
        e evita stacking entre Sheet (lateral) e Dialog (centro).
      */}
          <LeadDialog
            lead={editingLead}
            intent={createIntent}
            lockedBusinessUnitId={
              editingLead?.businessUnitId ||
              (createIntent === "real-estate"
                ? captureMetrics.realEstateBusinessUnitId
                : captureMetrics.insuranceBusinessUnitId) ||
              undefined
            }
            defaultInterestCategories={defaultInterestCategories}
            open={
              canManageLeads &&
              dialogOpen &&
              (!isLeadSheetV2 || forceLegacyForm || editingLead === null)
            }
            pending={createLead.isPending || updateLead.isPending}
            error={createLead.error ?? updateLead.error}
            onOpenExistingLead={openLeadById}
            onSubmitLockedChange={(locked) => {
              leadDialogSubmitLockedRef.current = locked
            }}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setEditingLead(null)
                setForceLegacyForm(false)
                console.log("[DRAWER] 7-before-loading-false")
                createSubmitLockRef.current = false
                console.log("[DRAWER] 8-after-loading-false")
                createIdempotencyKeyRef.current = null
                resetLeadSaveMutationsState("lead-dialog-onOpenChange-close")
              }
            }}
            onSubmit={async (input) => {
              if (editingLead) {
                await updateLead.mutateAsync({ id: editingLead.id, input })
                setDialogOpen(false)
                setForceLegacyForm(false)
                return
              }

              if (createLead.isPending || createSubmitLockRef.current) return

              createSubmitLockRef.current = true
              createIdempotencyKeyRef.current =
                createIdempotencyKeyRef.current ?? createLeadIdempotencyKey()
              const submitStartedAt = performance.now()
              const traceId = createIdempotencyKeyRef.current
              leadCreatePerfRef.current = { traceId, submitStartedAt }
              bug010LeadCreateStart(traceId)
              bug010LeadCreateLog("createLead mutation start", {}, traceId)

              console.log("[DRAWER] 2-before-mutate")
              bug010DrawerLog("before mutateAsync()", {
                status: createLead.status,
                isPending: createLead.isPending,
              })
              try {
                const lead = await createLead.mutateAsync({
                  ...input,
                  idempotencyKey: createIdempotencyKeyRef.current,
                  perfSubmitStartedAt: submitStartedAt,
                  perfTraceId: traceId,
                })
                bug010DrawerLog("mutateAsync resolve", {
                  status: createLead.status,
                  isPending: createLead.isPending,
                })
                bug010LeadCreateLog("createLead mutation callback", {}, traceId)
                bug010LeadCreateLog("closeModal()", {}, traceId)
                console.log("[DRAWER] 5-before-close")
                bug010DrawerLog("before setDialogOpen(false)", {
                  status: createLead.status,
                  isPending: createLead.isPending,
                })
                setDialogOpen(false)
                bug010DrawerSetState({ dialogOpen: false })
                bug010DrawerLog("after setDialogOpen(false)", {
                  status: createLead.status,
                  isPending: createLead.isPending,
                })
                console.log("[DRAWER] 6-after-close")
                bug010LeadCreateLog("toast.success()", {}, traceId)
                setLeadCreateToast(`Lead ${lead.name} criado com sucesso.`)
                createIdempotencyKeyRef.current = null
              } catch (error) {
                bug010DrawerLog("mutateAsync reject", {
                  status: createLead.status,
                  isPending: createLead.isPending,
                })
                createIdempotencyKeyRef.current = null
                leadCreatePerfRef.current = null
                throw error
              } finally {
                bug010DrawerLog("onSettled local", {
                  status: createLead.status,
                  isPending: createLead.isPending,
                })
                console.log("[DRAWER] 3-after-mutate")
                createSubmitLockRef.current = false
              }
            }}
          />

          {isLeadSheetV2 ? (
            <LeadSheetV2
              lead={editingLead}
              open={
                canManageLeads &&
                dialogOpen &&
                editingLead !== null &&
                !forceLegacyForm
              }
              isConverting={convertLead.isPending}
              onOpenChange={(open) => {
                if (!open) {
                  setDialogOpen(false)
                  setEditingLead(null)
                  setForceLegacyForm(false)
                  resetLeadSaveMutationsState("lead-sheet-v2-onOpenChange-close")
                  closeEntitySheetNavigation({
                    router,
                    pathname,
                    searchParams,
                    entityType: "lead",
                  })
                }
              }}
              onConvert={(lead) => {
                // openConvertDialog já fecha o sheet/dialog ANTES de abrir o
                // ConvertLeadDialog — evita stacking de portais.
                openConvertDialog(lead)
              }}
              onEdit={(lead) => {
                resetLeadSaveMutationsState("lead-sheet-v2-onEdit")
                setEditingLead(lead)
                setForceLegacyForm(true)
              }}
              onFillQuestionnaire={(lead) => {
                // QuestionnaireSubmissionDialog é Dialog centro; pode coexistir
                // com o sheet à direita, mas fechamos o sheet pra reduzir ruído
                // visual e manter a atenção operacional.
                setDialogOpen(false)
                setEditingLead(null)
                setForceLegacyForm(false)
                setQuestionnaireLead(lead)
              }}
              onViewSubmission={(submissionId) => {
                // QuestionnaireSubmissionDetailSheet é Sheet lateral — sobrepõe
                // o LeadSheetV2 no mesmo lado. Fechamos o sheet v2 antes pra
                // evitar dois sheets coexistirem.
                setDialogOpen(false)
                setEditingLead(null)
                setForceLegacyForm(false)
                setSelectedSubmissionId(submissionId)
              }}
              canEditStatus={canManageLeads}
              statusPending={updateLead.isPending}
              onStatusChange={(status) => {
                if (!editingLead) return
                updateLead.mutate({ id: editingLead.id, input: { status } })
              }}
            />
          ) : null}

          <ConvertLeadDialog
            key={convertTarget?.id ?? "convert-closed"}
            lead={convertTarget}
            open={convertTarget !== null}
            pending={convertLead.isPending}
            onOpenChange={(open) => {
              if (!open) closeConvertDialog()
            }}
            onConvert={async (lead) => {
              if (convertLead.isPending || convertSubmitLockRef.current) return
              convertSubmitLockRef.current = true
              try {
                const { deal } = await convertLead.mutateAsync({ id: lead.id })
                closeConvertDialog()
                setConvertToastDealId(deal.id)
              } catch {
                // erro exibido via convertLead.error
              } finally {
                convertSubmitLockRef.current = false
              }
            }}
            onContinueQuestionnaire={(lead) => {
              closeConvertDialog()
              setQuestionnaireLead(lead)
            }}
          />

          <QuestionnaireSubmissionDialog
            open={canManageQuestionnaires && Boolean(questionnaireLead)}
            leadId={questionnaireLead?.id ?? null}
            leadName={questionnaireLead?.name}
            onOpenChange={(open) => {
              if (!open) setQuestionnaireLead(null)
            }}
          />

          <QuestionnaireSubmissionDetailSheet
            submissionId={selectedSubmissionId}
            open={selectedSubmissionId !== null}
            onOpenChange={(open) => {
              if (!open) setSelectedSubmissionId(null)
            }}
          />

          <ActionToast
            open={convertToastDealId !== null}
            message="Negócio criado"
            actionLabel="Abrir negócio"
            onAction={() => {
              if (convertToastDealId) {
                router.push(`/crm/negocios?deal=${convertToastDealId}`)
              }
              setConvertToastDealId(null)
            }}
            onDismiss={() => setConvertToastDealId(null)}
          />
          <ActionToast
            open={leadCreateToast !== null}
            message={leadCreateToast ?? ""}
            onDismiss={() => setLeadCreateToast(null)}
            autoHideMs={4000}
            tone="success"
          />
        </OperationalPageLayout>
      </ContentContainer>
    </PageContainer>
  )
}
