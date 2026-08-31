"use client"

import {
  Profiler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRightLeft,
  ClipboardList,
  Edit3,
  ExternalLink,
  Filter,
  Loader2,
  Mail,
  Phone,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react"

import { ActivityQuickActions } from "@/components/activities/activity-quick-actions"
import { ActivityTimeline } from "@/components/activities/activity-timeline"
import { CommercialWarningBanner } from "@/components/crm/commercial-warning-banner"
import { PermissionGate } from "@/components/auth/permission-gate"
import {
  useCanManage,
  useSession,
  useShowMineLeadsFilter,
} from "@/components/auth/session-provider"
import { ConvertLeadDialog } from "@/components/leads/convert-lead-dialog"
import { LeadSheetV2 } from "@/components/leads/lead-sheet-v2"
import { LeadQuestionnaireBadge } from "@/components/questionnaires/lead-questionnaire-badge"
import { QuestionnaireSubmissionDetailSheet } from "@/components/questionnaires/questionnaire-submission-detail-sheet"
import { QuestionnaireSubmissionDialog } from "@/components/questionnaires/questionnaire-submission-dialog"
import { ActionToast } from "@/components/shared"
import {
  ContentContainer,
  DataTable,
  FilterBar,
  FilterSearch,
  FilterSelect,
  FormSelect,
  Grid,
  PageContainer,
  PageHeader,
  PageActions,
  PageActionsGroup,
  Section,
  Stack,
  StatCard,
  type DataTableColumn,
} from "@/components/design-system"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { getErrorMessage } from "@/lib/data-access"
import {
  formatDocumentMask,
  formatPhoneBrMask,
  LEAD_DOCUMENT_TYPES,
  normalizeDocument,
  type LeadDocumentType,
} from "@/lib/documents/document"
import { queryKeys } from "@/lib/data-access/query-keys"
import type {
  CreateLeadInput,
  Lead,
  LeadDuplicate,
  LeadListFilters,
  LeadStatus,
} from "@/lib/data-access/modules/leads"
import {
  fetchLead,
  LEAD_STATUSES,
  useConvertLead,
  useCreateLead,
  useDeleteLead,
  useLeadDuplicates,
  useLeads,
  useUpdateLead,
} from "@/lib/data-access/modules/leads"
import {
  buildLeadDialogFormState,
  EMPTY_LEAD_DIALOG_FORM,
  shouldShowPageLeadSaveError,
  type LeadDialogFormState,
} from "@/lib/data-access/modules/leads/lead-dialog-form"
import { resetLeadSaveMutations } from "@/lib/data-access/modules/leads/lead-dialog-mutations"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import {
  INTEREST_CATEGORIES,
  INTEREST_CATEGORY_LABELS,
  type InterestCategory,
} from "@/lib/business-units/constants"
import { closeEntitySheetNavigation } from "@/lib/crm/entity-sheet-navigation"
import { dsContentLayoutVariant } from "@/lib/design-system"
import { isLeadConverted, leadOwnerDisplayName } from "@/lib/leads/lead-owner"
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

const PAGE_SIZE = 10
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

function LeadDialogBusinessFields({
  form,
  update,
}: {
  form: LeadDialogFormState
  update: <K extends keyof LeadDialogFormState>(
    key: K,
    value: LeadDialogFormState[K],
  ) => void
}) {
  const { data: units = [] } = useBusinessUnits()

  return (
    <>
      <label className="space-y-2 sm:col-span-2">
        <span className="text-sm font-medium">Unidade de negócio</span>
        <FormSelect
          value={form.businessUnitId}
          onChange={(event) => update("businessUnitId", event.target.value)}
          options={[
            { value: "", label: "Selecionar unidade" },
            ...units.map((unit) => ({ value: unit.id, label: unit.name })),
          ]}
        />
      </label>
      <div className="space-y-2 sm:col-span-2">
        <span className="text-sm font-medium">Interesses</span>
        <div className="flex flex-wrap gap-2">
          {INTEREST_CATEGORIES.map((category) => {
            const active = form.interestCategories.includes(category)
            return (
              <button
                key={category}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  active
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-white/[0.08] text-muted-foreground",
                )}
                onClick={() =>
                  update(
                    "interestCategories",
                    active
                      ? form.interestCategories.filter((item) => item !== category)
                      : [...form.interestCategories, category],
                  )
                }
              >
                {INTEREST_CATEGORY_LABELS[category]}
              </button>
            )
          })}
        </div>
      </div>
    </>
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
    (lead: Lead | null = null) => {
      resetLeadSaveMutationsState("openLeadDialog")
      if (!lead) {
        createSubmitLockRef.current = false
        createIdempotencyKeyRef.current = null
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

  useEffect(() => {
    if (searchParams.get("create") === "lead" && canManageLeads) {
      openLeadDialog(null)
      const params = new URLSearchParams(searchParams.toString())
      params.delete("create")
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }
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
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9 border border-white/10">
              <AvatarFallback className="bg-primary/20 text-[11px] font-semibold text-primary">
                {row.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium tracking-[-0.02em]">{row.name}</p>
              <p className="text-xs text-muted-foreground">
                {row.company || "Sem empresa"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "contact",
        header: "Contato",
        hideOnMobile: true,
        render: (row) => (
          <div className="space-y-1 text-xs text-muted-foreground">
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
          <Badge
            variant="outline"
            className="rounded-full border-white/10 text-[10px]"
          >
            {row.source || "Não informada"}
          </Badge>
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
        key: "questionnaire",
        header: "Questionário",
        render: (row) => (
          <LeadQuestionnaireBadge
            leadId={row.id}
            onViewSubmission={setSelectedSubmissionId}
            onFill={() => setQuestionnaireLead(row)}
          />
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
    [setSelectedSubmissionId],
  )

  return (
    <PageContainer>
      <ContentContainer variant={dsContentLayoutVariant.leads}>
        <Stack gap="xl">
          <PageHeader
            eyebrow="Captação comercial"
            title={
              <span className="inline-flex items-center gap-2">
                Leads
                <Badge variant="secondary">{meta?.total ?? leads.length}</Badge>
              </span>
            }
            description="Cadastro único multiempresa — Corretora Ávila e Ávila Imóveis."
            actions={
              <PageActions>
                <PageActionsGroup
                  variant="primary"
                  aria-label="Ações principais"
                >
                  <PermissionGate permission="leads:manage">
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <Upload className="size-3.5" strokeWidth={1.5} />
                      Importar
                    </Button>
                  </PermissionGate>
                  {canManageLeads ? (
                    <Button
                      size="sm"
                      className="h-9"
                      onClick={() => openLeadDialog(null)}
                    >
                      Novo lead
                    </Button>
                  ) : null}
                </PageActionsGroup>
              </PageActions>
            }
          />

          <Profiler
            id="BUG010.1 Lead cards"
            onRender={bug010LeadCreateProfiler("cards")}
          >
            <Grid columns="3">
              <LeadMetric
                icon={UserPlus}
                label="Leads"
                value={meta?.total ?? leads.length}
              />
              <LeadMetric
                icon={ArrowRightLeft}
                label="Convertidos"
                value={meta?.counts?.converted ?? 0}
              />
              <LeadMetric
                icon={Filter}
                label="Qualificados"
                value={meta?.counts?.qualified ?? 0}
              />
            </Grid>
          </Profiler>

          <Section>
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
                  Meus leads
                </label>
              ) : null}
            </FilterBar>
          </Section>

          <Section>
            <DataTable
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
              emptyDescription="Clique em Novo para começar."
              emptyAction={
                <PermissionGate permission="leads:manage">
                  <Button size="sm" onClick={() => openLeadDialog(null)}>
                    Novo lead
                  </Button>
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
              title="Todos os leads"
              subtitle={`${meta?.total ?? leads.length} registros na captação`}
            />
          </Section>

          {pageLeadError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
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
        </Stack>
      </ContentContainer>
    </PageContainer>
  )
}

function LeadMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return <StatCard icon={Icon} label={label} value={value} tone="primary" />
}

type LeadForm = LeadDialogFormState

function formatLeadDate(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function buildDuplicateMeta(duplicate: LeadDuplicate) {
  return (
    <ul className="space-y-0.5">
      <li>
        <span className="opacity-70">Status:</span>{" "}
        {statusLabels[duplicate.status]}
      </li>
      <li>
        <span className="opacity-70">Responsável:</span>{" "}
        {duplicate.assignedTo || "Sem responsável"}
      </li>
      <li>
        <span className="opacity-70">Último contato:</span>{" "}
        {formatLeadDate(duplicate.lastContactAt)}
      </li>
      <li>
        <span className="opacity-70">Criado em:</span>{" "}
        {formatLeadDate(duplicate.createdAt)}
      </li>
    </ul>
  )
}

function optionalFormValue(value: string) {
  return value.trim() || undefined
}

function LeadDialog({
  lead,
  open,
  pending,
  error,
  onOpenChange,
  onSubmit,
  onOpenExistingLead,
  onSubmitLockedChange,
}: {
  lead: Lead | null
  open: boolean
  pending: boolean
  error: unknown
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateLeadInput) => void | Promise<void>
  onOpenExistingLead: (leadId: string) => void
  onSubmitLockedChange: (locked: boolean) => void
}) {
  const { session } = useSession()
  const [duplicateDismissed, setDuplicateDismissed] = useState(false)
  const [form, setForm] = useState<LeadForm>(EMPTY_LEAD_DIALOG_FORM)
  const [submitLocked, setSubmitLocked] = useState(false)

  const duplicatesQuery = useLeadDuplicates({
    document: form.document,
    excludeId: lead?.id,
    enabled: open && !duplicateDismissed,
    debounceMs: 500,
  })

  const duplicates = duplicatesQuery.data ?? []
  const primaryDuplicate = duplicates[0]

  useEffect(() => {
    onSubmitLockedChange(submitLocked)
  }, [onSubmitLockedChange, submitLocked])

  useEffect(() => {
    if (!open) {
      setDuplicateDismissed(false)
      setForm(EMPTY_LEAD_DIALOG_FORM)
      console.log("[DRAWER] 7-before-loading-false")
      bug010DrawerLog("before setSubmitLocked(false)")
      setSubmitLocked(false)
      bug010DrawerSetState({ submitLocked: false })
      bug010DrawerLog("after setSubmitLocked(false)")
      console.log("[DRAWER] 8-after-loading-false")
      return
    }

    setDuplicateDismissed(false)
    console.log("[DRAWER] 7-before-loading-false")
    bug010DrawerLog("before setSubmitLocked(false)")
    setSubmitLocked(false)
    bug010DrawerSetState({ submitLocked: false })
    bug010DrawerLog("after setSubmitLocked(false)")
    console.log("[DRAWER] 8-after-loading-false")
    setForm(buildLeadDialogFormState(lead, session?.name))
  }, [lead, open, session?.name])

  useEffect(() => {
    if (error) {
      console.log("[DRAWER] 7-before-loading-false")
      bug010DrawerLog("before setSubmitLocked(false)")
      setSubmitLocked(false)
      bug010DrawerSetState({ submitLocked: false })
      bug010DrawerLog("after setSubmitLocked(false)")
      console.log("[DRAWER] 8-after-loading-false")
    }
  }, [error])

  useEffect(() => {
    setDuplicateDismissed(false)
  }, [form.document, form.documentType])

  function update<K extends keyof LeadForm>(key: K, value: LeadForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || submitLocked) return
    if (!form.name.trim()) return
    bug010DrawerResetFlow()
    bug010DrawerSetState({ dialogOpen: open, submitLocked })
    bug010DrawerLog("submit()")
    console.log("[DRAWER] 1-submit")
    setSubmitLocked(true)
    bug010DrawerSetState({ submitLocked: true })

    const normalized = normalizeDocument(
      form.document.trim() ? form.documentType : undefined,
      form.document,
    )

    try {
      await onSubmit({
        name: form.name.trim(),
        email: optionalFormValue(form.email),
        phone: optionalFormValue(form.phone),
        company: optionalFormValue(form.company),
        source: optionalFormValue(form.source),
        ...(normalized
          ? {
              documentType: normalized.documentType,
              document: normalized.document,
            }
          : {}),
        notes: optionalFormValue(form.notes),
        assignedTo: optionalFormValue(form.assignedTo),
        businessUnitId: form.businessUnitId || undefined,
        interestCategories: form.interestCategories,
        ...(form.followUpDays
          ? {
              followUpDays: Number(form.followUpDays),
              followUpType: "WHATSAPP" as const,
            }
          : {}),
      })
    } finally {
      bug010DrawerLog("before setSubmitLocked(false)")
      setSubmitLocked(false)
      bug010DrawerSetState({ submitLocked: false })
      bug010DrawerLog("after setSubmitLocked(false)")
    }
  }

  const submitPending = pending || submitLocked

  useEffect(() => {
    console.log("[DRAWER] isSubmitting =", submitPending)
  }, [submitPending])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
            <DialogDescription>
              {lead
                ? "Atualize os dados de contato e contexto comercial do lead."
                : "Cadastre a oportunidade de entrada. O status inicial será Novo — o fluxo comercial avança conforme as interações."}
            </DialogDescription>
            {lead ? (
              <p className="text-xs text-muted-foreground">
                {formatLastInteraction(
                  lead.lastInteractionAt ?? lead.lastContactAt,
                )}
              </p>
            ) : null}
          </DialogHeader>

          {lead ? (
            <ActivityQuickActions
              leadId={lead.id}
              dealId={lead.dealId}
              compact
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Nome</span>
              <Input
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Ex.: Marina Costa"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">E-mail</span>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="lead@email.com"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Telefone</span>
              <Input
                value={form.phone}
                onChange={(event) =>
                  update("phone", formatPhoneBrMask(event.target.value))
                }
                placeholder="(11) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Tipo de documento</span>
              <FormSelect
                value={form.documentType}
                onChange={(event) =>
                  update("documentType", event.target.value as LeadDocumentType)
                }
                options={LEAD_DOCUMENT_TYPES.map((item) => ({
                  value: item,
                  label: item.toUpperCase(),
                }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">
                {form.documentType === "cpf" ? "CPF" : "CNPJ"}
              </span>
              <Input
                value={form.document}
                onChange={(event) =>
                  update(
                    "document",
                    formatDocumentMask(form.documentType, event.target.value),
                  )
                }
                placeholder={
                  form.documentType === "cpf"
                    ? "000.000.000-00"
                    : "00.000.000/0000-00"
                }
                inputMode="numeric"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Empresa</span>
              <Input
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
                placeholder="Ex.: Transportes Sul"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Origem</span>
              <Input
                value={form.source}
                onChange={(event) => update("source", event.target.value)}
                placeholder="whatsapp, site, indicação..."
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Responsável</span>
              <Input
                value={form.assignedTo}
                onChange={(event) => update("assignedTo", event.target.value)}
                placeholder="Ex.: Ana Costa"
              />
            </label>
            <LeadDialogBusinessFields form={form} update={update} />
        {!lead ? (
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">Próximo contato</span>
            <FormSelect
              value={form.followUpDays}
              onChange={(event) => update("followUpDays", event.target.value)}
              options={[
                { value: "", label: "Não agendar agora" },
                { value: "1", label: "Amanhã" },
                { value: "3", label: "Em 3 dias" },
                { value: "7", label: "Em 7 dias" },
                { value: "15", label: "Em 15 dias" },
              ]}
            />
          </label>
        ) : null}
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Notas</span>
              <Input
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Contexto da oportunidade"
              />
            </label>
          </div>

          {primaryDuplicate && !duplicateDismissed ? (
            <CommercialWarningBanner
              title={`Já existe lead com este ${form.documentType === "cpf" ? "CPF" : "CNPJ"}`}
              description={
                <span>
                  <strong>{primaryDuplicate.name}</strong>
                  {duplicates.length > 1
                    ? ` e mais ${duplicates.length - 1} registro(s) com o mesmo documento.`
                    : " possui o mesmo documento."}
                </span>
              }
              meta={buildDuplicateMeta(primaryDuplicate)}
              primaryAction={{
                label: "Abrir lead existente",
                onClick: () => onOpenExistingLead(primaryDuplicate.id),
              }}
              secondaryAction={{
                label: "Continuar mesmo assim",
                variant: "outline",
                onClick: () => setDuplicateDismissed(true),
              }}
            />
          ) : null}

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar lead")}
            </p>
          ) : null}

          {lead ? (
            <>
              <Separator className="bg-white/[0.06]" />
              <ActivityTimeline leadId={lead.id} dealId={lead.dealId} />
            </>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitPending}>
              {submitPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando…
                </>
              ) : lead ? (
                "Salvar alterações"
              ) : (
                "Salvar lead"
              )}
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
