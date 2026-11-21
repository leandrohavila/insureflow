"use client"

import {
  Profiler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  CalendarClock,
  CircleCheck,
  CircleDashed,
  Clock,
  Briefcase,
  ExternalLink,
  Eye,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react"
import { hasPermission, type Permission } from "@repo/auth"

import { PermissionGate } from "@/components/auth/permission-gate"
import {
  useCanManage,
  usePermission,
  useSession,
  useShowMineLeadsFilter,
} from "@/components/auth/session-provider"
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon"
import { ConvertLeadDialog } from "@/components/leads/convert-lead-dialog"
import { LeadCreateEmptyActions, LeadCreateMenu } from "@/components/leads/lead-create-menu"
import { LeadCaptureMetricsGrid } from "@/components/leads/lead-capture-metrics"
import { LeadDialog } from "@/components/leads/lead-dialog"
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet"
import { LeadSheetV2 } from "@/components/leads/lead-sheet-v2"
import { ActivityFormDialog } from "@/components/activities/activity-form-dialog"
import { QuestionnaireSubmissionDetailSheet } from "@/components/questionnaires/questionnaire-submission-detail-sheet"
import { IntelligentFormWizard } from "@/components/questionnaires/intelligent-form-wizard"
import { QuestionnaireSubmissionDialog } from "@/components/questionnaires/questionnaire-submission-dialog"
import { ActionToast } from "@/components/shared"
import {
  ContentContainer,
  DataTable,
  FilterBar,
  FilterSearch,
  FilterSelect,
  FilterText,
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
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getErrorMessage } from "@/lib/data-access"
import { queryKeys } from "@/lib/data-access/query-keys"
import type {
  Lead,
  LeadListFilters,
  LeadListSort,
  LeadStatus,
} from "@/lib/data-access/modules/leads"
import type { QuestionnaireSubmission } from "@/lib/data-access/modules/questionnaires"
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
import { NEXT_CONTACT_ACTIVITY_OPTIONS } from "@/lib/data-access/modules/leads/lead-next-contact-form"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import { CrmFilterChip, crmFilterFieldClass } from "@/components/crm/crm-controls"
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
import { leadPipelinePresentation } from "@/lib/leads/lead-pipeline-clarity"
import { stageLabelMap, useCrmDeals } from "@/lib/data-access/modules/crm"
import {
  deriveLeadOperationalBadges,
  deriveLeadPriority,
  LEAD_OPERATIONAL_BADGE_LABEL,
  LEAD_PRIORITY_LABEL,
  leadTelHref,
  leadWhatsAppHref,
} from "@/lib/leads/lead-operational-signals"
import { useCreateActivity } from "@/lib/data-access/modules/activities"
import { activityTypeSubjects } from "@/lib/crm/activity-labels"
import {
  LEAD_CONTACT_ACTIVITY_TYPES,
  LEAD_SCHEDULE_ACTIVITY_TYPES,
} from "@/lib/leads/lead-detail-view"
import {
  bug010LeadCreateLog,
  bug010LeadCreateProfiler,
  bug010LeadCreateStart,
} from "@/lib/performance/bug010-lead-create"
import {
  bug010DrawerLog,
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

const sortLabels: Record<LeadListSort, string> = {
  recent: "Mais recentes",
  oldest: "Mais antigos",
  name: "Nome",
  lastContact: "Última interação",
}

const statusLabels: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
}

const statusStyles: Record<LeadStatus, string> = {
  new: "border-[#D6CFC4] bg-white text-[#10294B]",
  contacted: "border-[#C9C3E4] bg-[#F4F1FA] text-[#3E3570]",
  qualified: "border-[#C09048] bg-[#FBF6EF] text-[#10294B]",
  converted: "border-[#B7D7C8] bg-[#E8F5EF] text-[#1F6B4A]",
  lost: "border-[#E4C4C4] bg-[#F8ECEC] text-[#8C3030]",
}

const leadActionButtonClass =
  "h-9 w-auto max-w-full min-w-0 justify-center gap-1 overflow-hidden px-2.5! text-xs font-semibold"

function LeadIconButton({
  label,
  disabled,
  onClick,
  tone = "muted",
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  tone?: "phone" | "whatsapp" | "schedule" | "view" | "muted"
  children: ReactNode
}) {
  const toneClass = {
    phone: "text-[#1F6B4A]",
    whatsapp: "text-[#128C7E]",
    schedule: "text-[#8A6230]",
    view: "text-[#10294B]",
    muted: "text-[#5C6578]",
  }[tone]
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation()
              onClick()
            }}
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#D6CFC4] bg-white transition-colors hover:bg-[#F6F1E8] focus-visible:ring-2 focus-visible:ring-[#10294B]/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
              toneClass,
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

const AVATAR_TONES = [
  "bg-[var(--avila-gold-600)]/18 text-[var(--avila-navy-900)]",
  "bg-info/15 text-info",
  "bg-success/15 text-success",
  "bg-warning/20 text-warning-foreground",
  "bg-primary/10 text-primary",
]

function avatarTone(name: string) {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % AVATAR_TONES.length
  }
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0]
}

function formatLeadMoment(iso?: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const diffDays = Math.round(
    (startOfDay(date) - startOfDay(new Date())) / 86_400_000,
  )
  if (diffDays === 0) return `Hoje, ${time}`
  if (diffDays === -1) return `Ontem, ${time}`
  if (diffDays === 1) return `Amanhã, ${time}`
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${time}`
}

function nextContactActivityLabel(type?: string | null) {
  return (
    NEXT_CONTACT_ACTIVITY_OPTIONS.find((item) => item.value === type)?.label ??
    null
  )
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
      showLabel
      label="Empresa"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(crmFilterFieldClass, "min-w-[8.5rem]")}
      options={[
        { value: "all", label: "Todas" },
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
  const [period, setPeriod] = useState<"all" | "7" | "30" | "90">("all")
  const [sort, setSort] = useState<LeadListSort>("recent")
  const [mineOnly, setMineOnly] = useState(false)
  const { data: businessUnits = [] } = useBusinessUnits()
  const [activityIntent, setActivityIntent] = useState<{
    lead: Lead
    mode: "contact" | "schedule"
  } | null>(null)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [questionnaireLead, setQuestionnaireLead] = useState<Lead | null>(null)
  const [intelligentForm, setIntelligentForm] = useState<{
    lead: Lead
    templateId: string | null
    submissionId: string | null
  } | null>(null)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null)
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
  const convertDialogEpochRef = useRef(0)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [detailLead, setDetailLead] = useState<Lead | null>(null)
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
  const { session } = useSession()
  const canManageLeads = useCanManage("leads:view")
  const canConvertLeads = usePermission("leads:manage")
  const canViewDeals = usePermission("crm:view")
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
      createdWithinDays: period === "all" ? undefined : Number(period) as 7 | 30 | 90,
      sort,
      page,
      limit: PAGE_SIZE,
    }),
    [businessUnitId, interestCategory, mineOnly, page, period, search, sort, source, status],
  )

  const leadsQuery = useLeads(filters)
  const captureMetrics = useLeadCaptureMetrics()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead(filters)
  const deleteLead = useDeleteLead(filters)
  const convertLead = useConvertLead(filters)
  const createActivity = useCreateActivity({
    leadId: activityIntent?.lead.id,
  })
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

  const openLeadDetails = useCallback(
    (lead: Lead) => {
      if (isLeadSheetV2) {
        openLeadDialog(lead)
        return
      }
      setDetailLead(lead)
    },
    [isLeadSheetV2, openLeadDialog],
  )

  useEffect(() => {
    console.log("[DRAWER] dialogOpen =", dialogOpen)
    bug010DrawerLog("dialogOpen effect", {
      status: createLead.status,
      isPending: createLead.isPending,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- BUG-010: snapshot on dialogOpen only
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- BUG-010: snapshot on isPending only
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

  const closeLeadDetails = useCallback(() => {
    setDetailLead(null)
    if (searchParams.get("lead")) syncLeadUrlParams({ lead: null })
  }, [searchParams, syncLeadUrlParams])

  const closeConvertDialog = useCallback(() => {
    convertDialogEpochRef.current += 1
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

    const epoch = convertDialogEpochRef.current
    let cancelled = false
    void fetchLead(deepLinkId)
      .then((lead) => {
        if (cancelled || epoch !== convertDialogEpochRef.current) return
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
        openLeadDetails(lead)
      })
      .catch(() => {
        // lead inexistente ou sem permissão — ignorar
      })

    return () => {
      cancelled = true
    }
  }, [openLeadDetails, searchParams, syncLeadUrlParams])

  const leads = useMemo(
    () => leadsQuery.data?.data ?? [],
    [leadsQuery.data?.data],
  )
  const visibleLeads = leads
  const meta = leadsQuery.data?.meta
  const leadCountLabel =
    leadsQuery.isError && meta?.total == null
      ? "—"
      : String(meta?.total ?? leads.length)
  const hasConvertedOnPage = visibleLeads.some((row) => Boolean(row.dealId))
  const dealsForStage = useCrmDeals({ enabled: hasConvertedOnPage })
  const stageByDealId = useMemo(() => {
    const map = new Map<string, string>()
    for (const deal of dealsForStage.data ?? []) {
      map.set(deal.id, stageLabelMap[deal.stage] ?? deal.stage)
    }
    return map
  }, [dealsForStage.data])
  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (source.trim() ? 1 : 0) +
    (businessUnitId !== "all" ? 1 : 0) +
    (interestCategory !== "all" ? 1 : 0) +
    (period !== "all" ? 1 : 0) +
    (sort !== "recent" ? 1 : 0) +
    (mineOnly ? 1 : 0)
  const appliedFilters = useMemo(() => {
    const unitName = businessUnits.find((unit) => unit.id === businessUnitId)?.name
    const periodLabel =
      period === "7" ? "7 dias" : period === "30" ? "30 dias" : period === "90" ? "90 dias" : null
    return [
      searchInput.trim()
        ? {
            id: "search",
            label: `Busca: ${searchInput.trim()}`,
            clear: () => setSearchInput(""),
          }
        : null,
      status !== "all"
        ? {
            id: "status",
            label: `Status: ${statusLabels[status]}`,
            clear: () => setStatus("all"),
          }
        : null,
      mineOnly
        ? { id: "mine", label: "Meus leads", clear: () => setMineOnly(false) }
        : null,
      source.trim()
        ? {
            id: "source",
            label: `Origem: ${source.trim()}`,
            clear: () => setSource(""),
          }
        : null,
      interestCategory !== "all"
        ? {
            id: "interest",
            label: INTEREST_CATEGORY_LABELS[interestCategory],
            clear: () => setInterestCategory("all"),
          }
        : null,
      periodLabel
        ? {
            id: "period",
            label: periodLabel,
            clear: () => setPeriod("all"),
          }
        : null,
      businessUnitId !== "all"
        ? {
            id: "unit",
            label: unitName ?? "Empresa",
            clear: () => setBusinessUnitId("all"),
          }
        : null,
      sort !== "recent"
        ? {
            id: "sort",
            label: `Ordem: ${sortLabels[sort]}`,
            clear: () => setSort("recent"),
          }
        : null,
    ].filter((item) => item != null)
  }, [
    businessUnitId,
    businessUnits,
    interestCategory,
    mineOnly,
    period,
    searchInput,
    sort,
    source,
    status,
  ])

  useEffect(() => {
    if (!showMineFilter && mineOnly) {
      setMineOnly(false)
    }
  }, [mineOnly, showMineFilter])

  useEffect(() => {
    setPage(1)
  }, [businessUnitId, interestCategory, mineOnly, period, search, sort, source, status])

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
        sticky: "left",
        className:
          "w-[138px] max-w-[138px] overflow-hidden static! left-auto! z-auto! shadow-none! backdrop-blur-none!",
        render: (row) => {
          const priority = deriveLeadPriority(row)
          const badges = deriveLeadOperationalBadges(row)
          return (
            <div className="flex w-full min-w-0 items-center gap-2.5 py-0.5">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback
                  className={cn(
                    "text-[11px] font-semibold",
                    avatarTone(row.name),
                  )}
                >
                  {row.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 leading-tight">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <p className="line-clamp-2 w-full text-left text-sm font-semibold leading-5 tracking-tight break-words text-foreground" />
                    }
                  >
                    {row.name}
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left whitespace-normal">
                    {row.name}
                  </TooltipContent>
                </Tooltip>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-1.5! py-0.5! text-[10px] font-semibold",
                      priority === "high" && "bg-[#F8ECEC] text-[#8C3030]",
                      priority === "medium" && "bg-[#FBF6EF] text-[#8A6230]",
                      priority === "low" && "bg-[#F6F1E8] text-[#5C6578]",
                    )}
                  >
                    {LEAD_PRIORITY_LABEL[priority]}
                  </span>
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className={cn(
                        "text-[11px] font-medium",
                        badge === "no_contact" && "text-info",
                        badge === "contact_today" && "text-success",
                        badge === "overdue" && "text-destructive",
                        badge === "renewal_soon" && "text-warning-foreground",
                      )}
                    >
                      {LEAD_OPERATIONAL_BADGE_LABEL[badge]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        key: "contact",
        header: "Contato",
        className: "w-[140px] max-w-[140px] overflow-hidden",
        render: (row) => (
          <div className="flex w-full min-w-0 flex-col justify-center gap-1 text-[13px] leading-none text-foreground">
            {row.phone ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="flex w-full min-w-0 items-center gap-1.5" />
                  }
                >
                  <Phone className="size-3.5 shrink-0 text-success" />
                  <span className="min-w-0 truncate">{row.phone}</span>
                </TooltipTrigger>
                <TooltipContent>{row.phone}</TooltipContent>
              </Tooltip>
            ) : null}
            {row.email ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="flex w-full min-w-0 items-center gap-1.5" />
                  }
                >
                  <Mail className="size-3.5 shrink-0 text-info" />
                  <span className="min-w-0 truncate">{row.email}</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left whitespace-normal">
                  {row.email}
                </TooltipContent>
              </Tooltip>
            ) : null}
            {!row.email && !row.phone ? "—" : null}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        className: "w-[92px] max-w-[92px] overflow-hidden",
        render: (row) => (
          <span
            className={cn(
              "inline-flex h-6 items-center rounded-full border px-2.5! text-[11px] font-semibold leading-none",
              statusStyles[row.status],
            )}
          >
            {statusLabels[row.status]}
          </span>
        ),
      },
      {
        key: "owner",
        header: "Responsável",
        hideOnMobile: true,
        className: "w-[76px] max-w-[76px] overflow-hidden",
        render: (row) => {
          const owner = leadOwnerDisplayName(row) || "—"
          return (
            <span className="block truncate text-sm text-foreground" title={owner}>
              {owner}
            </span>
          )
        },
      },
      {
        key: "source",
        header: "Origem",
        hideOnMobile: true,
        className: "w-[52px] max-w-[52px] overflow-hidden",
        render: (row) => (
          <span
            className="block max-w-[11rem] truncate text-sm text-foreground"
            title={row.source || undefined}
          >
            {row.source || "—"}
          </span>
        ),
      },
      {
        key: "lastInteraction",
        header: "Última interação",
        hideOnMobile: true,
        className: "w-[92px] max-w-[92px] overflow-hidden",
        render: (row) => {
          const when = formatLeadMoment(
            row.lastInteractionAt ?? row.lastContactAt,
          )
          const label = when ?? "Sem interação"
          return (
            <span
              className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-sm text-foreground"
              title={label}
            >
              <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate">{label}</span>
            </span>
          )
        },
      },
      {
        key: "pipeline",
        header: "Pipeline",
        className: "w-[80px] max-w-[80px] overflow-hidden",
        render: (row) => {
          const stage = row.dealId ? stageByDealId.get(row.dealId) : null
          const view = leadPipelinePresentation(row, stage)
          const PipelineIcon = view.converted ? CircleCheck : CircleDashed
          return (
            <div className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "inline-flex min-w-0 max-w-full items-center gap-1.5 text-sm font-medium",
                  view.converted ? "text-success" : "text-destructive",
                )}
                title={view.statusLabel}
              >
                <PipelineIcon className="size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{view.statusLabel}</span>
              </span>
              {view.stageLabel ? (
                <span
                  className="block min-w-0 truncate pl-5 text-[11px] text-muted-foreground"
                  title={view.stageLabel}
                >
                  {view.stageLabel}
                </span>
              ) : null}
            </div>
          )
        },
      },
      {
        key: "pipelineAction",
        header: "Ação",
        className: "w-[136px] max-w-[136px] overflow-hidden",
        render: (row) => {
          const view = leadPipelinePresentation(row)
          return (
            <div onClick={(event) => event.stopPropagation()}>
              {view.showConvert && canConvertLeads ? (
                <Button
                  type="button"
                  variant="crmPrimary"
                  className={leadActionButtonClass}
                  title="Converter em negócio"
                  disabled={convertLead.isPending}
                  onClick={() => openConvertDialog(row)}
                >
                  <Briefcase className="size-3.5 shrink-0" />
                  <span className="truncate">Converter</span>
                </Button>
              ) : null}
              {view.showOpenDeal && canViewDeals && row.dealId ? (
                <Button
                  type="button"
                  variant="crmSecondary"
                  className={leadActionButtonClass}
                  title="Abrir negócio"
                  onClick={() => router.push(`/crm/negocios?deal=${row.dealId}`)}
                >
                  <ExternalLink className="size-3.5 shrink-0" />
                  <span className="truncate">Abrir negócio</span>
                </Button>
              ) : null}
              {view.converted && !view.showOpenDeal ? (
                <span className="text-sm font-medium text-success">
                  Negócio criado
                </span>
              ) : null}
            </div>
          )
        },
      },
      {
        key: "nextAction",
        header: "Próxima ação",
        hideOnMobile: true,
        className: "w-[135px] max-w-[135px] overflow-hidden whitespace-nowrap",
        render: (row) => {
          const when = formatLeadMoment(row.nextContactAt)
          const detail =
            row.nextContactNotes?.trim() ||
            nextContactActivityLabel(row.nextContactType)
          const scheduled = row.nextContactAt
            ? new Date(row.nextContactAt)
            : null
          const overdue =
            scheduled != null &&
            !Number.isNaN(scheduled.getTime()) &&
            scheduled.getTime() < Date.now() &&
            row.status !== "converted" &&
            row.status !== "lost"
          if (!when && !detail) {
            return (
              <span className="block truncate text-sm leading-5 whitespace-nowrap text-muted-foreground">
                Sem próxima ação
              </span>
            )
          }
          const fullLabel = [when ?? "Agendada", detail]
            .filter(Boolean)
            .join(" · ")
          return (
            <TooltipProvider delay={400}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="block w-full min-w-0 max-w-full overflow-hidden text-left" />
                  }
                >
                  <span
                    className={cn(
                      "flex w-full min-w-0 items-center gap-1.5",
                      overdue ? "text-destructive" : "text-foreground",
                    )}
                  >
                    <Clock
                      className={cn(
                        "size-3.5 shrink-0",
                        overdue ? "text-destructive" : "text-warning-foreground",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium leading-5">
                      {when ?? "Agendada"}
                    </span>
                  </span>
                  {detail ? (
                    <span className="mt-0.5 block min-w-0 truncate pl-5 text-[11px] leading-4 whitespace-nowrap text-muted-foreground">
                      {detail}
                    </span>
                  ) : null}
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left whitespace-normal">
                  {fullLabel}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        },
      },
      {
        key: "quick",
        header: "Ações",
        className: "w-[192px] max-w-[192px] px-2! whitespace-nowrap",
        render: (row) => {
          const tel = leadTelHref(row.phone)
          const wa = leadWhatsAppHref(row.phone)
          const menu: Array<{
            key: string
            label: string
            icon?: ReactNode
            permission?: Permission
            hidden?: boolean
            disabled?: boolean
            destructive?: boolean
            onSelect: () => void
          }> = [
            {
              key: "open-deal",
              label: "Abrir negócio",
              icon: <ExternalLink className="size-3.5" />,
              permission: "crm:view",
              disabled: !row.dealId,
              onSelect: () => {
                if (row.dealId) router.push(`/crm/negocios?deal=${row.dealId}`)
              },
            },
            {
              key: "questionnaire",
              label: "Preencher questionário",
              permission: "questionnaires:manage",
              onSelect: () => setQuestionnaireLead(row),
            },
            {
              key: "convert",
              label: "Converter em negócio",
              icon: <Briefcase className="size-3.5" />,
              permission: "leads:manage",
              disabled: row.status === "converted" || convertLead.isPending,
              onSelect: () => openConvertDialog(row),
            },
            {
              key: "edit",
              label: "Editar lead",
              icon: <Pencil className="size-3.5" />,
              permission: "leads:manage",
              onSelect: () => openLeadDialog(row),
            },
            {
              key: "delete",
              label: "Excluir lead",
              icon: <Trash2 className="size-3.5" />,
              permission: "leads:manage",
              destructive: true,
              hidden: isLeadConverted(row),
              disabled: deleteLead.isPending,
              onSelect: () => {
                if (isLeadConverted(row)) return
                if (window.confirm(`Excluir lead ${row.name}?`)) {
                  deleteLead.mutate(row.id)
                }
              },
            },
          ]
          const visibleMenu = menu.filter(
            (action) =>
              !action.hidden &&
              (!action.permission || hasPermission(session, action.permission)),
          )
          return (
            <TooltipProvider delay={400}>
              <div
                className="inline-flex w-max max-w-full flex-nowrap items-center gap-1"
                onClick={(event) => event.stopPropagation()}
              >
                <LeadIconButton
                  label="Ligar"
                  tone="phone"
                  disabled={!tel}
                  onClick={() => {
                    if (tel) window.open(tel, "_self")
                  }}
                >
                  <Phone className="size-3.5" />
                </LeadIconButton>
                <LeadIconButton
                  label="WhatsApp"
                  tone="whatsapp"
                  disabled={!wa}
                  onClick={() => {
                    if (wa) window.open(wa, "_blank", "noopener,noreferrer")
                  }}
                >
                  <WhatsAppIcon className="size-3.5" />
                </LeadIconButton>
                <LeadIconButton
                  label="Agendar"
                  tone="schedule"
                  onClick={() =>
                    setActivityIntent({ lead: row, mode: "schedule" })
                  }
                >
                  <CalendarClock className="size-3.5" />
                </LeadIconButton>
                <LeadIconButton label="Abrir" tone="view" onClick={() => openLeadDetails(row)}>
                  <Eye className="size-3.5" />
                </LeadIconButton>
                {visibleMenu.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Mais ações"
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {visibleMenu.map((action) => (
                        <DropdownMenuItem
                          key={action.key}
                          variant={action.destructive ? "destructive" : "default"}
                          disabled={action.disabled}
                          onClick={action.onSelect}
                        >
                          {action.icon}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </TooltipProvider>
          )
        },
      },
    ],
    [
      canConvertLeads,
      canViewDeals,
      convertLead.isPending,
      deleteLead,
      openConvertDialog,
      openLeadDetails,
      openLeadDialog,
      router,
      session,
      stageByDealId,
    ],
  )

  return (
    <PageContainer className="max-w-none min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4! pt-4! pb-8!">
      <ContentContainer
        variant={dsContentLayoutVariant.leads}
        className="max-w-none"
      >
        <OperationalPageLayout density="dense" className="h-auto overflow-visible">
          <PageHeader
            className="shrink-0"
            breadcrumbs={
              <ol className="flex items-center gap-1.5">
                <li>
                  <Link href="/crm" className="hover:text-foreground">
                    CRM
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li className="font-medium text-foreground" aria-current="page">
                  Leads
                </li>
              </ol>
            }
            title={
              <span className="inline-flex items-center gap-2.5">
                Leads
                <Badge
                  variant="secondary"
                  className="h-6 rounded-full px-2 text-xs font-medium text-muted-foreground"
                >
                  {leadCountLabel}
                </Badge>
              </span>
            }
            description="Central operacional — priorize contato, follow-up e conversão."
            actions={
              <PageActions>
                <PageActionsGroup
                  variant="primary"
                  aria-label="Ações principais"
                >
                  <PermissionGate permission="leads:manage">
                    <LeadCreateMenu
                      appearance="crm"
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
                </PageActionsGroup>
                <PageActionsGroup aria-label="Ações secundárias">
                  <PermissionGate permission="leads:manage">
                    <Link
                      href="/crm/importacoes/leads"
                      className={cn(buttonVariants({ variant: "crmSecondary" }), "gap-1.5")}
                    >
                      <Upload className="size-3.5" strokeWidth={1.5} />
                      Importar
                    </Link>
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
                unavailable={captureMetrics.isError}
                activeStatus={status}
                onStatusSelect={(next) =>
                  setStatus((current) => (current === next ? "all" : next))
                }
              />
            </Profiler>
          </OperationalWorkspaceMetrics>

          <OperationalWorkspace className="overflow-visible">
            <OperationalWorkspaceToolbar dense>
            <div className="rounded-xl border border-[#D6CFC4] bg-white p-3! text-[#10294B] shadow-[0_1px_2px_rgb(16_41_75/0.04)] [&_label>span]:text-[#5C6578]">
            <FilterBar className="items-end">
              <FilterSearch
                label="Buscar leads"
                placeholder="Nome, telefone, e-mail, origem…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                containerClassName="w-full min-w-[14rem] max-w-full basis-full sm:w-auto sm:min-w-[16.25rem] sm:max-w-[18rem] sm:basis-[16rem] sm:flex-1"
                className={cn(crmFilterFieldClass, "pl-10! pr-3!")}
              />
              <FilterSelect
                showLabel
                label="Status"
                value={status}
                className={cn(crmFilterFieldClass, "min-w-[7.5rem]")}
                onChange={(event) =>
                  setStatus(event.target.value as LeadStatus | "all")
                }
                options={[
                  { value: "all", label: "Todos" },
                  ...LEAD_STATUSES.map((item) => ({
                    value: item,
                    label: statusLabels[item],
                  })),
                ]}
              />
              <FilterSelect
                showLabel
                label="Responsável"
                value={mineOnly ? "mine" : "all"}
                className={cn(crmFilterFieldClass, "min-w-[7.5rem]")}
                onChange={(event) =>
                  setMineOnly(event.target.value === "mine")
                }
                options={[
                  { value: "all", label: "Todos" },
                  { value: "mine", label: "Meus leads" },
                ]}
              />
              <FilterText
                showLabel
                label="Origem"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="Todas"
                className={cn(crmFilterFieldClass, "min-w-[7.5rem]")}
              />
              <FilterSelect
                showLabel
                label="Tipo de Seguro"
                value={interestCategory}
                className={cn(crmFilterFieldClass, "min-w-[8.5rem]")}
                onChange={(event) =>
                  setInterestCategory(
                    event.target.value as InterestCategory | "all",
                  )
                }
                options={[
                  { value: "all", label: "Todos" },
                  ...INTEREST_CATEGORIES.map((item) => ({
                    value: item,
                    label: INTEREST_CATEGORY_LABELS[item],
                  })),
                ]}
              />
              <FilterSelect
                showLabel
                label="Período"
                value={period}
                className={cn(crmFilterFieldClass, "min-w-[7rem]")}
                onChange={(event) =>
                  setPeriod(event.target.value as "all" | "7" | "30" | "90")
                }
                options={[
                  { value: "all", label: "Todos" },
                  { value: "7", label: "7 dias" },
                  { value: "30", label: "30 dias" },
                  { value: "90", label: "90 dias" },
                ]}
              />
              <BusinessUnitFilter
                value={businessUnitId}
                onChange={setBusinessUnitId}
              />
              <FilterSelect
                showLabel
                label="Ordenar"
                value={sort}
                className={cn(crmFilterFieldClass, "min-w-[8.5rem]")}
                onChange={(event) =>
                  setSort(event.target.value as LeadListSort)
                }
                options={(
                  Object.keys(sortLabels) as LeadListSort[]
                ).map((item) => ({
                  value: item,
                  label: sortLabels[item],
                }))}
              />
              <Button
                type="button"
                variant="crmSecondary"
                className="self-end"
                disabled={activeFilterCount === 0}
                onClick={() => {
                  setSearchInput("")
                  setStatus("all")
                  setSource("")
                  setBusinessUnitId("all")
                  setInterestCategory("all")
                  setPeriod("all")
                  setSort("recent")
                  setMineOnly(false)
                }}
              >
                Limpar
              </Button>
            </FilterBar>
            {appliedFilters.length > 0 ? (
              <div
                className="mt-3! flex flex-wrap gap-2"
                aria-label="Filtros aplicados"
              >
                {appliedFilters.map((item) => (
                  <CrmFilterChip
                    key={item.id}
                    pressed
                    onClick={item.clear}
                  >
                    {item.label}
                  </CrmFilterChip>
                ))}
              </div>
            ) : null}
            </div>
            </OperationalWorkspaceToolbar>

            <OperationalWorkspaceMain className="overflow-visible">
            <DataTable
              density="default"
              className="w-full"
              cellClassName="px-2! py-2.5! align-middle whitespace-normal"
              headerCellClassName="px-2! py-2.5! whitespace-normal"
              tableClassName="w-full table-fixed min-w-[1135px]"
              data={visibleLeads}
              columns={columns}
              getRowId={(row) => row.id}
              selectable={false}
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
                    appearance="crm"
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
                      openLeadDetails(row)
                    }
                  : undefined
              }
              pagination={{
                meta: {
                  page: meta?.page ?? page,
                  totalPages: meta?.totalPages ?? 1,
                  total: meta?.total,
                },
                onPageChange: setPage,
                summary:
                  leadsQuery.isError && meta?.total == null
                    ? "Contagem indisponível"
                    : `Mostrando ${
                        (meta?.total ?? leads.length) === 0
                          ? 0
                          : (page - 1) * PAGE_SIZE + 1
                      } a ${Math.min(page * PAGE_SIZE, meta?.total ?? leads.length)} de ${meta?.total ?? leads.length} leads`,
                pageSizeLabel: `${PAGE_SIZE} por página`,
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
          <ActivityFormDialog
            presentation="drawer"
            lockLink
            linkPreference="lead"
            linkTitle={activityIntent?.lead.name}
            linkDetail={activityIntent?.lead.phone ?? undefined}
            open={Boolean(activityIntent)}
            onOpenChange={(open) => {
              if (!open) setActivityIntent(null)
            }}
            initialType={
              activityIntent?.mode === "schedule" ? "follow_up" : undefined
            }
            allowedTypes={
              activityIntent?.mode === "schedule"
                ? LEAD_SCHEDULE_ACTIVITY_TYPES
                : LEAD_CONTACT_ACTIVITY_TYPES
            }
            requireNextFollowUp={activityIntent?.mode === "schedule"}
            title={
              activityIntent?.mode === "schedule"
                ? "Agendar próximo passo"
                : "Registrar contato"
            }
            description={
              activityIntent?.mode === "schedule"
                ? "O próximo passo fica neste lead e aparece na Agenda, sem um segundo registro."
                : "Registra um contato já realizado. Abrir telefone ou WhatsApp não grava a interação."
            }
            leadId={activityIntent?.lead.id}
            pending={createActivity.isPending}
            error={createActivity.error}
            onSubmit={(input) => {
              if (!activityIntent) return
              const subject =
                input.subject.trim() ||
                activityTypeSubjects[input.type] ||
                "Atividade"
              createActivity.mutate(
                {
                  ...input,
                  subject,
                  leadId: activityIntent.lead.id,
                  status:
                    activityIntent.mode === "contact" ? "completed" : "pending",
                },
                { onSuccess: () => setActivityIntent(null) },
              )
            }}
          />
          <LeadDialog
            lead={editingLead}
            intent={createIntent}
            lockedBusinessUnitId={
              editingLead
                ? editingLead.businessUnitId || undefined
                : (createIntent === "real-estate"
                    ? captureMetrics.realEstateBusinessUnitId
                    : captureMetrics.insuranceBusinessUnitId) || undefined
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
            onMarkLost={
              editingLead
                ? async (input) => {
                    const updated = await updateLead.mutateAsync({
                      id: editingLead.id,
                      input,
                    })
                    setEditingLead(updated)
                  }
                : undefined
            }
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
                setLeadCreateToast(
                  `Alterações de ${input.name.trim()} salvas.`,
                )
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
                if (status === "lost") return
                updateLead.mutate({ id: editingLead.id, input: { status } })
              }}
            />
          ) : null}

          <LeadDetailSheet
            lead={detailLead}
            open={detailLead !== null && !isLeadSheetV2}
            stageLabel={
              detailLead?.dealId
                ? stageByDealId.get(detailLead.dealId)
                : null
            }
            canEdit={canManageLeads}
            canConvert={canConvertLeads}
            canReactivate={canConvertLeads}
            canViewDeals={canViewDeals}
            canSchedule
            onOpenChange={(open) => {
              if (!open) closeLeadDetails()
            }}
            onEdit={(lead) => {
              closeLeadDetails()
              openLeadDialog(lead)
            }}
            onConvert={(lead) => {
              setDetailLead(null)
              openConvertDialog(lead)
            }}
            onRegisterContact={(lead) =>
              setActivityIntent({ lead, mode: "contact" })
            }
            onSchedule={(lead) =>
              setActivityIntent({ lead, mode: "schedule" })
            }
            onOpenDeal={(dealId) => {
              closeLeadDetails()
              router.push(`/crm/negocios?deal=${dealId}`)
            }}
            onStartIntelligentQuestionnaire={(lead) =>
              setIntelligentForm({
                lead,
                templateId: null,
                submissionId: null,
              })
            }
            onContinueIntelligentQuestionnaire={(
              lead,
              submission: QuestionnaireSubmission,
            ) =>
              setIntelligentForm({
                lead,
                templateId: submission.templateId,
                submissionId: submission.id,
              })
            }
            onViewQuestionnaire={(submissionId) => {
              closeLeadDetails()
              setSelectedSubmissionId(submissionId)
            }}
          />
          <ConvertLeadDialog
            key={convertTarget?.id ?? "convert-closed"}
            lead={convertTarget}
            open={convertTarget !== null}
            pending={convertLead.isPending}
            error={convertLead.error}
            onOpenChange={(open) => {
              if (!open && !convertLead.isPending) closeConvertDialog()
            }}
            onConvert={async (lead) => {
              if (convertLead.isPending || convertSubmitLockRef.current) return
              convertSubmitLockRef.current = true
              try {
                const { deal } = await convertLead.mutateAsync({ id: lead.id })
                if (!deal?.id) {
                  convertSubmitLockRef.current = false
                  return
                }
                setConvertTarget(null)
                router.replace(`/crm/negocios?deal=${deal.id}`)
              } catch {
                convertSubmitLockRef.current = false
              }
            }}
            onContinueQuestionnaire={(lead) => {
              closeConvertDialog()
              setQuestionnaireLead(lead)
            }}
          />

          <IntelligentFormWizard
            open={canManageQuestionnaires && intelligentForm !== null}
            leadId={intelligentForm?.lead.id ?? null}
            leadName={intelligentForm?.lead.name}
            templateId={intelligentForm?.templateId}
            submissionId={intelligentForm?.submissionId}
            onOpenChange={(open) => {
              if (!open) setIntelligentForm(null)
            }}
          />

          <QuestionnaireSubmissionDialog
            open={canManageQuestionnaires && Boolean(questionnaireLead)}
            leadId={questionnaireLead?.id ?? null}
            leadName={questionnaireLead?.name}
            lead={questionnaireLead}
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
