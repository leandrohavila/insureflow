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
import { NEXT_CONTACT_ACTIVITY_OPTIONS } from "@/lib/data-access/modules/leads/lead-next-contact-form"
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

const statusLabels: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
}

const statusStyles: Record<LeadStatus, string> = {
  new: "border-success/30 bg-success/15 text-success",
  contacted: "border-info/25 bg-info/12 text-info",
  qualified: "border-[var(--avila-gold-600)]/45 bg-[var(--avila-gold-600)]/16 text-[var(--avila-navy-900)]",
  converted: "border-success/25 bg-success/20 text-success",
  lost: "border-destructive/30 bg-destructive/12 text-destructive",
}

const leadActionButtonClass =
  "h-8 w-full max-w-[9.25rem] justify-center px-2 text-xs font-semibold"

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
    phone: "text-[var(--avila-action-success)] hover:bg-[var(--avila-action-success)]/12",
    whatsapp: "text-[#128C7E] hover:bg-[var(--avila-action-whatsapp)]/20",
    schedule: "text-[var(--avila-action-info)] hover:bg-[var(--avila-action-info)]/12",
    view: "text-[var(--avila-action-primary)] hover:bg-[var(--avila-action-primary)]/10",
    muted: "text-muted-foreground hover:bg-muted hover:text-foreground",
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
              "inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
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
      className="h-9 min-w-[8.5rem] bg-card px-3!"
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
  const [mineOnly, setMineOnly] = useState(false)
  const [scheduleLead, setScheduleLead] = useState<Lead | null>(null)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [questionnaireLead, setQuestionnaireLead] = useState<Lead | null>(null)
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
      page,
      limit: PAGE_SIZE,
    }),
    [businessUnitId, interestCategory, mineOnly, page, period, search, source, status],
  )

  const leadsQuery = useLeads(filters)
  const captureMetrics = useLeadCaptureMetrics()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead(filters)
  const deleteLead = useDeleteLead(filters)
  const convertLead = useConvertLead(filters)
  const createActivity = useCreateActivity({
    leadId: scheduleLead?.id,
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
    (mineOnly ? 1 : 0)

  useEffect(() => {
    if (!showMineFilter && mineOnly) {
      setMineOnly(false)
    }
  }, [mineOnly, showMineFilter])

  useEffect(() => {
    setPage(1)
  }, [businessUnitId, interestCategory, mineOnly, period, search, source, status])

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
        className: "w-[14%]",
        render: (row) => {
          const priority = deriveLeadPriority(row)
          const badges = deriveLeadOperationalBadges(row)
          return (
            <div className="flex items-center gap-2.5 py-0.5">
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
              <div className="min-w-0 leading-tight">
                <p
                  className="line-clamp-2 text-sm font-semibold tracking-tight text-foreground"
                  title={row.name}
                >
                  {row.name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-1.5! py-0.5! text-[10px] font-semibold",
                      priority === "high" && "bg-destructive/12 text-destructive",
                      priority === "medium" && "bg-warning/25 text-warning-foreground",
                      priority === "low" && "bg-muted text-muted-foreground",
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
        className: "w-[13%]",
        render: (row) => (
          <div className="flex flex-col justify-center gap-1 text-[13px] leading-none text-foreground">
            {row.phone ? (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0 text-success" />
                <span className="truncate">{row.phone}</span>
              </span>
            ) : null}
            {row.email ? (
              <span className="flex items-center gap-1.5" title={row.email}>
                <Mail className="size-3.5 shrink-0 text-info" />
                <span className="truncate">{row.email}</span>
              </span>
            ) : null}
            {!row.email && !row.phone ? "—" : null}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        className: "w-[8%]",
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
        className: "w-[8%]",
        render: (row) => (
          <span className="block truncate text-sm text-foreground">
            {leadOwnerDisplayName(row) || "—"}
          </span>
        ),
      },
      {
        key: "source",
        header: "Origem",
        hideOnMobile: true,
        className: "w-[7%]",
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
        className: "w-[10%]",
        render: (row) => {
          const when = formatLeadMoment(
            row.lastInteractionAt ?? row.lastContactAt,
          )
          return (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-foreground">
              <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
              {when ?? "Sem interação"}
            </span>
          )
        },
      },
      {
        key: "pipeline",
        header: "Pipeline",
        className: "w-[9%]",
        render: (row) => {
          const stage = row.dealId ? stageByDealId.get(row.dealId) : null
          const view = leadPipelinePresentation(row, stage)
          const PipelineIcon = view.converted ? CircleCheck : CircleDashed
          return (
            <div className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-medium",
                  view.converted ? "text-success" : "text-destructive",
                )}
              >
                <PipelineIcon className="size-3.5 shrink-0" aria-hidden />
                {view.statusLabel}
              </span>
              {view.stageLabel ? (
                <span className="pl-5 text-[11px] text-muted-foreground">
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
        className: "w-[9%]",
        render: (row) => {
          const view = leadPipelinePresentation(row)
          return (
            <div onClick={(event) => event.stopPropagation()}>
              {view.showConvert && canConvertLeads ? (
                <Button
                  type="button"
                  variant="convert"
                  size="sm"
                  className={leadActionButtonClass}
                  title="Converter em negócio"
                  disabled={convertLead.isPending}
                  onClick={() => openConvertDialog(row)}
                >
                  <Briefcase className="size-3.5" />
                  Converter
                </Button>
              ) : null}
              {view.showOpenDeal && canViewDeals && row.dealId ? (
                <Button
                  type="button"
                  variant="view"
                  size="sm"
                  className={leadActionButtonClass}
                  onClick={() => router.push(`/crm/negocios?deal=${row.dealId}`)}
                >
                  <ExternalLink className="size-3.5" />
                  Abrir negócio
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
        className: "w-[11%]",
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
              <span className="text-sm text-muted-foreground">
                — Sem próxima ação
              </span>
            )
          }
          return (
            <div className="flex min-w-0 flex-col gap-0.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-medium",
                  overdue ? "text-destructive" : "text-foreground",
                )}
              >
                <Clock
                  className={cn(
                    "size-3.5 shrink-0",
                    overdue ? "text-destructive" : "text-warning-foreground",
                  )}
                />
                {when ?? "Agendada"}
              </span>
              {detail ? (
                <span className="line-clamp-2 pl-5 text-[11px] leading-snug text-muted-foreground">
                  {detail}
                </span>
              ) : null}
            </div>
          )
        },
      },
      {
        key: "quick",
        header: "Ações",
        className: "w-[11%]",
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
                className="flex items-center justify-end gap-0.5"
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
                  onClick={() => setScheduleLead(row)}
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
                      accent
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
                      className={cn(
                        buttonVariants({ variant: "import", size: "sm" }),
                        "h-9 gap-1.5 px-3!",
                      )}
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
              />
            </Profiler>
          </OperationalWorkspaceMetrics>

          <OperationalWorkspace className="overflow-visible">
            <OperationalWorkspaceToolbar dense>
            <div className="rounded-xl border border-border bg-card p-3! shadow-[0_1px_2px_rgb(0_12_36/0.04)]">
            <FilterBar className="items-end">
              <FilterSearch
                label="Buscar leads"
                placeholder="Nome, telefone, e-mail, origem…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                containerClassName="w-full min-w-[14rem] max-w-full basis-full sm:w-auto sm:max-w-[18rem] sm:basis-[16rem] sm:flex-1"
                className="h-9 bg-background pr-3!"
              />
              <FilterSelect
                showLabel
                label="Status"
                value={status}
                className="h-9 min-w-[7.5rem] bg-card px-3!"
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
                className="h-9 min-w-[7.5rem] bg-card px-3!"
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
                className="h-9 min-w-[7.5rem] bg-card px-3!"
              />
              <FilterSelect
                showLabel
                label="Tipo de Seguro"
                value={interestCategory}
                className="h-9 min-w-[8.5rem] bg-card px-3!"
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
                className="h-9 min-w-[7rem] bg-card px-3!"
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 self-end"
                disabled={activeFilterCount === 0}
                onClick={() => {
                  setSearchInput("")
                  setStatus("all")
                  setSource("")
                  setBusinessUnitId("all")
                  setInterestCategory("all")
                  setPeriod("all")
                  setMineOnly(false)
                }}
              >
                Limpar
              </Button>
            </FilterBar>
            </div>
            </OperationalWorkspaceToolbar>

            <OperationalWorkspaceMain className="overflow-visible">
            <DataTable
              density="default"
              className="w-full"
              cellClassName="px-3! py-2.5! align-middle whitespace-normal"
              headerCellClassName="px-3! py-2.5! whitespace-normal"
              tableClassName="w-full table-fixed max-lg:min-w-[64rem]"
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
                summary: `Mostrando ${
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
            open={Boolean(scheduleLead)}
            onOpenChange={(open) => {
              if (!open) setScheduleLead(null)
            }}
            initialType="follow_up"
            leadId={scheduleLead?.id}
            pending={createActivity.isPending}
            error={createActivity.error}
            onSubmit={(input) => {
              const subject =
                input.subject.trim() ||
                activityTypeSubjects[input.type] ||
                "Atividade"
              createActivity.mutate(
                { ...input, subject, leadId: scheduleLead?.id },
                { onSuccess: () => setScheduleLead(null) },
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
            canConvert={canConvertLeads}
            canViewDeals={canViewDeals}
            canSchedule
            onOpenChange={(open) => {
              if (!open) setDetailLead(null)
            }}
            onEdit={(lead) => {
              setDetailLead(null)
              openLeadDialog(lead)
            }}
            onConvert={(lead) => {
              setDetailLead(null)
              openConvertDialog(lead)
            }}
            onSchedule={(lead) => {
              setDetailLead(null)
              setScheduleLead(lead)
            }}
            onOpenDeal={(dealId) => {
              setDetailLead(null)
              router.push(`/crm/negocios?deal=${dealId}`)
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
