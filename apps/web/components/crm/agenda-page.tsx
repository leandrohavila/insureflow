"use client"

import { useCallback, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  AlarmClock,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Phone,
  RefreshCw,
} from "lucide-react"

import { ActivityFormDialog } from "@/components/activities/activity-form-dialog"
import { ActionToast } from "@/components/shared/action-toast"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { CrmOperationalEmptyState, CrmSectionLoading } from "@/components/crm/interaction"
import { FilterChip, StatusPill } from "@/components/crm/primitives"
import { PermissionGate } from "@/components/auth/permission-gate"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { activityTypeLabels } from "@/lib/crm/activity-labels"
import {
  activityTypeAccentVar,
  activityTypeIcons,
} from "@/lib/crm/activity-type-visual"
import { CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL } from "@/lib/crm/crm-layout-classes"
import { crmPageEnter } from "@/lib/crm/crm-motion"
import { queryKeys } from "@/lib/data-access/query-keys"
import { useCrmPersistedValue } from "@/lib/hooks/use-crm-workspace-preferences"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  ACTIVITY_TYPES,
  pickActivityRelationFields,
  type Activity,
  type ActivityListResponse,
  type ActivityType,
  type CreateActivityInput,
} from "@/lib/data-access/modules/activities"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import { useLeads } from "@/lib/data-access/modules/leads"
import {
  buildEntitySheetHref,
  buildReturnToFromCurrentLocation,
  type EntitySheetEntityType,
} from "@/lib/crm/entity-sheet-navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

type AgendaStatus = "overdue" | "today" | "upcoming"
type AgendaFilter = "all" | "overdue" | "today" | "upcoming"

type EnrichedFollowUp = {
  activity: Activity
  entityTitle: string
  entityType: "lead" | "deal" | "unknown"
  entityId: string | null
  entityCompany: string | null
  status: AgendaStatus
  followUpDate: Date
}

/**
 * register_contact — cria nova atividade (call/whatsapp/etc.) e conclui a original.
 * reschedule       — cria novo follow-up (form em modo create) e conclui a original.
 */
type DialogState =
  | {
      mode: "register_contact"
      originalId: string
      leadId?: string | null
      dealId?: string | null
      customerId?: string | null
      policyId?: string | null
    }
  | {
      mode: "reschedule"
      originalId: string
      leadId?: string | null
      dealId?: string | null
      customerId?: string | null
      policyId?: string | null
    }

// ─── Constants ────────────────────────────────────────────────────────────────

const RANGE_DAYS_BACK = 90
const RANGE_DAYS_FORWARD = 30

const FILTER_LABELS: Record<AgendaFilter, string> = {
  all: "Todos",
  overdue: "Atrasados",
  today: "Hoje",
  upcoming: "Próximos 7 dias",
}

const STATUS_CONFIG: Record<
  AgendaStatus,
  { label: string; tone: "danger" | "info" | "neutral"; row: string }
> = {
  overdue: {
    label: "Atrasado",
    tone: "danger",
    row: "agenda-row--overdue",
  },
  today: {
    label: "Hoje",
    tone: "info",
    row: "agenda-row--today",
  },
  upcoming: {
    label: "Agendado",
    tone: "neutral",
    row: "agenda-row--upcoming",
  },
}

const FILTER_ACCENT: Record<AgendaFilter, string | undefined> = {
  all: undefined,
  overdue: "var(--crm-tone-danger)",
  today: "var(--crm-tone-info)",
  upcoming: "var(--crm-tone-warn)",
}

const ACTIVITY_ICONS = activityTypeIcons

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getAgendaDateRange() {
  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - RANGE_DAYS_BACK)
  from.setHours(0, 0, 0, 0)
  const to = new Date(now)
  to.setDate(to.getDate() + RANGE_DAYS_FORWARD)
  to.setHours(23, 59, 59, 999)
  return {
    status: "pending" as const,
    nextFollowUpFrom: from.toISOString(),
    nextFollowUpTo: to.toISOString(),
    limit: 100,
  }
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfToday(): Date {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

function endOfNext7Days(): Date {
  const d = endOfToday()
  d.setDate(d.getDate() + 7)
  return d
}

function classifyStatus(nextFollowUpAt: string): AgendaStatus {
  const date = new Date(nextFollowUpAt)
  const todayStart = startOfToday()
  const todayEnd = endOfToday()
  if (date < todayStart) return "overdue"
  if (date >= todayStart && date <= todayEnd) return "today"
  return "upcoming"
}

function navigateToCrmEntitySheet(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  searchParams: Pick<URLSearchParams, "toString">,
  entityType: EntitySheetEntityType,
  entityId: string,
) {
  const returnTo = buildReturnToFromCurrentLocation(pathname, searchParams)
  router.push(
    buildEntitySheetHref({
      entityType,
      entityId,
      origin: "agenda",
      returnTo,
    }),
  )
}

function formatFollowUpTime(iso: string): string {
  const date = new Date(iso)
  const today = startOfToday()
  const end7 = endOfNext7Days()

  const timeStr = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)

  if (date < today) {
    const daysDiff = Math.ceil(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysDiff === 1) return `Ontem · ${timeStr}`
    if (daysDiff <= 7) return `${daysDiff} dias atrás · ${timeStr}`
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(date)
  }

  const todayStart = startOfToday()
  const todayEnd = endOfToday()
  if (date >= todayStart && date <= todayEnd) return `Hoje · ${timeStr}`

  if (date <= end7) {
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date)
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} · ${timeStr}`
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// ─── Follow-up card ───────────────────────────────────────────────────────────

type CardProps = {
  item: EnrichedFollowUp
  index: number
  onRegisterContact: (item: EnrichedFollowUp) => void
  onReschedule: (item: EnrichedFollowUp) => void
  onComplete: (activity: Activity) => void
  isCompleting: boolean
}

function AgendaFollowUpCard({
  item,
  index,
  onRegisterContact,
  onReschedule,
  onComplete,
  isCompleting,
}: CardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const reduce = useReducedMotion()
  const { activity, entityTitle, entityCompany, status } = item
  const Icon = ACTIVITY_ICONS[activity.type]
  const cfg = STATUS_CONFIG[status]
  const accentVar = activityTypeAccentVar[activity.type]

  const showOpenDeal = Boolean(activity.dealId)
  const showOpenLead = Boolean(activity.leadId)
  const showLinkedEntity = showOpenDeal || showOpenLead

  const openDeal = () => {
    if (!activity.dealId) return
    navigateToCrmEntitySheet(router, pathname, searchParams, "deal", activity.dealId)
  }

  const openLead = () => {
    if (!activity.leadId) return
    navigateToCrmEntitySheet(router, pathname, searchParams, "lead", activity.leadId)
  }

  const openLinkedEntity = () => {
    if (activity.dealId) {
      openDeal()
      return
    }
    if (activity.leadId) {
      openLead()
    }
  }

  const initials = activity.performedBy.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: easeOut }}
      className={cn(
        "agenda-row crm-interactive-row flex items-start gap-3 px-4 py-3.5 md:px-5",
        cfg.row,
        isCompleting && "agenda-row--completing",
      )}
    >
      {/* Activity type icon */}
      <div
        className="agenda-type-node mt-0.5 flex size-8 shrink-0 items-center justify-center"
        style={{ ["--crm-node-accent" as string]: accentVar }}
        aria-hidden
      >
        <Icon className="size-3.5" strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <p className="crm-text-title text-[13px] leading-snug">{activity.subject}</p>
          <StatusPill tone="neutral" variant="soft" size="xs">
            {activityTypeLabels[activity.type]}
          </StatusPill>
        </div>

        {/* Entity link */}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {showLinkedEntity ? (
            <button
              type="button"
              onClick={openLinkedEntity}
              className="crm-text-meta text-primary/85 transition-colors hover:text-primary"
            >
              {entityTitle}
            </button>
          ) : null}
          {entityCompany ? (
            <span className="crm-text-meta">· {entityCompany}</span>
          ) : null}
        </div>

        {/* Meta row */}
        <div className="crm-text-micro mt-1.5 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1">
            <CalendarClock className="size-3 shrink-0 opacity-60" aria-hidden />
            {formatFollowUpTime(activity.nextFollowUpAt!)}
          </span>
          <span aria-hidden>·</span>
          <span>{activity.performedBy.name}</span>
          {activity.outcome ? (
            <>
              <span aria-hidden>·</span>
              <span className="max-w-[28ch] truncate" title={activity.outcome}>
                {activity.outcome}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Right: status badge + avatar + actions */}
      <div className="flex shrink-0 items-center gap-2">
        <StatusPill
          tone={cfg.tone}
          variant="soft"
          size="xs"
          dot
          className="hidden sm:inline-flex"
        >
          {cfg.label}
        </StatusPill>

        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-primary/15 text-[9px] font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <PermissionGate permission="crm:manage">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 outline-none transition-colors hover:bg-[var(--crm-surface-panel-hover)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Ações do follow-up"
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={() => onRegisterContact(item)}
                className="gap-2"
              >
                <Phone className="size-3.5 text-sky-400" />
                Registrar contato
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onReschedule(item)}
                className="gap-2"
              >
                <RefreshCw className="size-3.5 text-amber-400" />
                Reagendar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {showOpenLead || showOpenDeal ? (
                <>
                  {showOpenLead ? (
                    <DropdownMenuItem onClick={openLead} className="gap-2">
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                      Abrir lead
                    </DropdownMenuItem>
                  ) : null}
                  {showOpenDeal ? (
                    <DropdownMenuItem onClick={openDeal} className="gap-2">
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                      Abrir negócio
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem
                onClick={() => onComplete(activity)}
                disabled={isCompleting}
                className="gap-2 text-emerald-400 focus:text-emerald-300"
              >
                {isCompleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Marcar concluído
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGate>
      </div>
    </motion.div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

type SectionProps = {
  title: string
  icon: typeof CalendarDays
  iconClass: string
  items: EnrichedFollowUp[]
  emptyLabel: string
  delay: number
  onRegisterContact: (item: EnrichedFollowUp) => void
  onReschedule: (item: EnrichedFollowUp) => void
  onComplete: (activity: Activity) => void
  completingId: string | null
}

function AgendaSection({
  title,
  icon: SectionIcon,
  iconClass,
  items,
  emptyLabel,
  delay,
  onRegisterContact,
  onReschedule,
  onComplete,
  completingId,
}: SectionProps) {
  const reduce = useReducedMotion()

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: easeOut }}
      className="flex flex-col gap-0"
    >
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <SectionIcon className={cn("size-4 shrink-0", iconClass)} strokeWidth={1.5} />
        <h2 className="crm-text-title text-[13px]">{title}</h2>
        <span
          className="crm-text-micro rounded-full px-1.5 py-px tabular-nums"
          style={{
            border: "1px solid var(--crm-stroke-faint)",
            background: "var(--crm-surface-panel)",
          }}
        >
          {items.length}
        </span>
      </div>

      <div className="agenda-section-panel rounded-lg">
        {items.length === 0 ? (
          <div className="crm-text-meta flex items-center gap-2 px-5 py-4">
            <CalendarCheck2 className="size-4 shrink-0 opacity-60" />
            {emptyLabel}
          </div>
        ) : (
          <div className="divide-y agenda-section-divider">
            {items.map((item, i) => (
              <AgendaFollowUpCard
                key={item.activity.id}
                item={item}
                index={i}
                onRegisterContact={onRegisterContact}
                onReschedule={onReschedule}
                onComplete={onComplete}
                isCompleting={completingId === item.activity.id}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AgendaPage() {
  const reduce = useReducedMotion()
  const queryClient = useQueryClient()

  // Stable date range — computed once on mount; includes status=pending filter
  const [dateRange] = useState(() => getAgendaDateRange())

  // UI state — filtros persistidos no workspace
  const isAgendaFilter = (value: string): value is AgendaFilter =>
    value === "all" ||
    value === "overdue" ||
    value === "today" ||
    value === "upcoming"

  const [persistedFilter, setPersistedFilter] = useCrmPersistedValue(
    "agenda.filter",
    isAgendaFilter,
  )
  const activeFilter: AgendaFilter = isAgendaFilter(persistedFilter)
    ? persistedFilter
    : "all"

  const isAgendaTypeFilter = (value: string): value is ActivityType | "all" =>
    value === "all" || ACTIVITY_TYPES.includes(value as ActivityType)

  const [persistedTypeFilter, setPersistedTypeFilter] = useCrmPersistedValue(
    "agenda.typeFilter",
    (value) => isAgendaTypeFilter(value),
  )
  const typeFilter: ActivityType | "all" = isAgendaTypeFilter(persistedTypeFilter)
    ? persistedTypeFilter
    : "all"
  const setTypeFilter = (value: ActivityType | "all") =>
    setPersistedTypeFilter(value)

  const [typeMenuOpen, setTypeMenuOpen] = useState(false)
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Data
  const activitiesQuery = useActivities(dateRange)
  const dealsQuery = useCrmDeals()
  const leadsQuery = useLeads({ limit: 100 })

  // Mutations
  const createMutation = useCreateActivity({})
  const updateMutation = useUpdateActivity({})

  // Lookup maps
  const dealsMap = useMemo(() => {
    const map = new Map<string, { title: string; company: string }>()
    for (const deal of dealsQuery.data ?? []) {
      map.set(deal.id, { title: deal.title, company: deal.company })
    }
    return map
  }, [dealsQuery.data])

  const leadsMap = useMemo(() => {
    const map = new Map<string, { name: string; company: string | null | undefined }>()
    for (const lead of leadsQuery.data?.data ?? []) {
      map.set(lead.id, { name: lead.name, company: lead.company })
    }
    return map
  }, [leadsQuery.data?.data])

  // Enrich + filter
  const enriched = useMemo<EnrichedFollowUp[]>(() => {
    const all = activitiesQuery.data?.data ?? []
    return all
      .filter((a) => Boolean(a.nextFollowUpAt))
      .filter((a) => a.status === "pending")
      .filter((a) => typeFilter === "all" || a.type === typeFilter)
      .map((activity) => {
        let entityTitle = "Sem vínculo"
        let entityType: EnrichedFollowUp["entityType"] = "unknown"
        let entityId: string | null = null
        let entityCompany: string | null = null

        if (activity.dealId) {
          const deal = dealsMap.get(activity.dealId)
          entityTitle = deal?.title ?? `Negócio #${activity.dealId.slice(-6)}`
          entityCompany = deal?.company ?? null
          entityType = "deal"
          entityId = activity.dealId
        } else if (activity.leadId) {
          const lead = leadsMap.get(activity.leadId)
          entityTitle = lead?.name ?? `Lead #${activity.leadId.slice(-6)}`
          entityCompany = lead?.company ?? null
          entityType = "lead"
          entityId = activity.leadId
        }

        const status = classifyStatus(activity.nextFollowUpAt!)
        const followUpDate = new Date(activity.nextFollowUpAt!)
        return { activity, entityTitle, entityType, entityId, entityCompany, status, followUpDate }
      })
      .sort((a, b) => a.followUpDate.getTime() - b.followUpDate.getTime())
  }, [activitiesQuery.data?.data, dealsMap, leadsMap, typeFilter])

  // Section partitions
  const overdueItems = useMemo(() => enriched.filter((i) => i.status === "overdue"), [enriched])
  const todayItems = useMemo(() => enriched.filter((i) => i.status === "today"), [enriched])
  const upcomingItems = useMemo(() => enriched.filter((i) => i.status === "upcoming"), [enriched])

  // Filtered per active tab
  const filteredOverdue = activeFilter === "all" || activeFilter === "overdue" ? overdueItems : []
  const filteredToday = activeFilter === "all" || activeFilter === "today" ? todayItems : []
  const filteredUpcoming =
    activeFilter === "all" || activeFilter === "upcoming" ? upcomingItems : []

  // Optimistically remove an activity from the pending agenda cache
  const removeFromAgendaCache = useCallback(
    (activityId: string) => {
      queryClient.setQueryData<ActivityListResponse>(
        queryKeys.activities.list(dateRange),
        (current) => {
          if (!current) return current
          return { ...current, data: current.data.filter((a) => a.id !== activityId) }
        },
      )
    },
    [queryClient, dateRange],
  )

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleRegisterContact(item: EnrichedFollowUp) {
    setDialog({
      mode: "register_contact",
      originalId: item.activity.id,
      leadId: item.activity.leadId,
      dealId: item.activity.dealId,
      customerId: item.activity.customerId,
      policyId: item.activity.policyId,
    })
  }

  function handleReschedule(item: EnrichedFollowUp) {
    setDialog({
      mode: "reschedule",
      originalId: item.activity.id,
      leadId: item.activity.leadId,
      dealId: item.activity.dealId,
      customerId: item.activity.customerId,
      policyId: item.activity.policyId,
    })
  }

  function handleComplete(activity: Activity) {
    setCompletingId(activity.id)
    // Optimistic removal for instant UX
    removeFromAgendaCache(activity.id)
    updateMutation.mutate(
      {
        id: activity.id,
        input: {
          status: "completed",
          nextFollowUpAt: null,
          ...pickActivityRelationFields(activity),
        },
      },
      {
        onSuccess: () => setToastMsg("Follow-up concluído"),
        onError: () => {
          // Rollback: re-fetch if the update failed
          void activitiesQuery.refetch()
        },
        onSettled: () => setCompletingId(null),
      },
    )
  }

  function handleDialogSubmit(input: CreateActivityInput) {
    const currentDialog = dialog
    if (!currentDialog) return

    const completeOriginal = (originalId: string, msg: string) => {
      const rel = {
        ...(currentDialog.leadId ? { leadId: currentDialog.leadId } : {}),
        ...(currentDialog.dealId ? { dealId: currentDialog.dealId } : {}),
        ...(currentDialog.customerId
          ? { customerId: currentDialog.customerId }
          : {}),
        ...(currentDialog.policyId ? { policyId: currentDialog.policyId } : {}),
      }
      // Optimistic removal before the PATCH round-trip
      removeFromAgendaCache(originalId)
      updateMutation.mutate(
        {
          id: originalId,
          input: { status: "completed", nextFollowUpAt: null, ...rel },
        },
        {
          onSuccess: () => setToastMsg(msg),
          onError: () => void activitiesQuery.refetch(),
        },
      )
    }

    if (currentDialog.mode === "register_contact") {
      createMutation.mutate(
        {
          ...input,
          leadId: currentDialog.leadId ?? undefined,
          dealId: currentDialog.dealId ?? undefined,
          customerId: currentDialog.customerId ?? undefined,
          policyId: currentDialog.policyId ?? undefined,
        },
        {
          onSuccess: () => {
            setDialog(null)
            completeOriginal(currentDialog.originalId, "Follow-up concluído")
          },
        },
      )
    } else {
      // reschedule: create new follow-up, complete original
      createMutation.mutate(
        {
          ...input,
          type: "follow_up",
          leadId: currentDialog.leadId ?? undefined,
          dealId: currentDialog.dealId ?? undefined,
          customerId: currentDialog.customerId ?? undefined,
          policyId: currentDialog.policyId ?? undefined,
        },
        {
          onSuccess: () => {
            setDialog(null)
            completeOriginal(currentDialog.originalId, "Follow-up reagendado")
          },
        },
      )
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const isLoading = activitiesQuery.isLoading || dealsQuery.isLoading || leadsQuery.isLoading
  const isFetching = activitiesQuery.isFetching

  const filterCounts: Record<AgendaFilter, number> = {
    all: overdueItems.length + todayItems.length + upcomingItems.length,
    overdue: overdueItems.length,
    today: todayItems.length,
    upcoming: upcomingItems.length,
  }

  const showOverdue = activeFilter === "all" || activeFilter === "overdue"
  const showToday = activeFilter === "all" || activeFilter === "today"
  const showUpcoming = activeFilter === "all" || activeFilter === "upcoming"

  const noItems =
    filteredOverdue.length === 0 &&
    filteredToday.length === 0 &&
    filteredUpcoming.length === 0

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={crmPageEnter}
      className={cn(CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL, "gap-6")}
    >
      {/* Header */}
      <CrmPageHeader
        badge="Agenda"
        title="Minha Agenda"
        description="Follow-ups pendentes, atrasados e próximos compromissos do dia."
      >
        {(isFetching && !isLoading) || isMutating ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            {isMutating ? "Salvando…" : "Atualizando…"}
          </span>
        ) : null}
      </CrmPageHeader>

      {/* Toolbar */}
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter pills */}
        <nav
          aria-label="Filtrar agenda por status"
          className="agenda-toolbar flex flex-wrap items-center gap-1 rounded-lg p-0.5"
        >
          {(["all", "overdue", "today", "upcoming"] as AgendaFilter[]).map((f) => (
            <FilterChip
              key={f}
              isActive={activeFilter === f}
              label={FILTER_LABELS[f]}
              count={filterCounts[f] > 0 ? filterCounts[f] : undefined}
              accentVar={FILTER_ACCENT[f]}
              onClick={() => setPersistedFilter(f)}
            />
          ))}
        </nav>

        {/* Type filter */}
        <DropdownMenu open={typeMenuOpen} onOpenChange={setTypeMenuOpen}>
          <DropdownMenuTrigger
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30"
            style={{
              border: "1px solid var(--crm-stroke-faint)",
              background: "var(--crm-surface-panel)",
            }}
          >
            <AlarmClock className="size-3.5 text-muted-foreground" />
            {typeFilter === "all" ? "Todos os tipos" : activityTypeLabels[typeFilter]}
            <ChevronDown className="size-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTypeFilter("all")}>
              Todos os tipos
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {(
              ["call", "whatsapp", "email", "meeting", "visit", "follow_up"] as ActivityType[]
            ).map((type) => (
              <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                {activityTypeLabels[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Loading */}
      <CrmSectionLoading
        isLoading={isLoading}
        label="Carregando agenda…"
        rows={5}
      />

      {/* Sections */}
      {!isLoading ? (
        <>
          {showOverdue ? (
            <AgendaSection
              title="Atrasados"
              icon={AlarmClock}
              iconClass="text-rose-400"
              items={filteredOverdue}
              emptyLabel="Nenhum follow-up atrasado."
              delay={0.05}
              onRegisterContact={handleRegisterContact}
              onReschedule={handleReschedule}
              onComplete={handleComplete}
              completingId={completingId}
            />
          ) : null}

          {showToday ? (
            <AgendaSection
              title="Hoje"
              icon={CalendarDays}
              iconClass="text-sky-400"
              items={filteredToday}
              emptyLabel="Nenhum follow-up para hoje. Bom trabalho!"
              delay={0.1}
              onRegisterContact={handleRegisterContact}
              onReschedule={handleReschedule}
              onComplete={handleComplete}
              completingId={completingId}
            />
          ) : null}

          {showUpcoming ? (
            <AgendaSection
              title="Próximos 7 dias"
              icon={CalendarClock}
              iconClass="text-amber-400"
              items={filteredUpcoming}
              emptyLabel="Nenhum follow-up nos próximos 7 dias."
              delay={0.15}
              onRegisterContact={handleRegisterContact}
              onReschedule={handleReschedule}
              onComplete={handleComplete}
              completingId={completingId}
            />
          ) : null}

          {noItems ? (
            <CrmOperationalEmptyState
              icon={CalendarCheck2}
              title="Agenda limpa"
              hint={
                activeFilter !== "all"
                  ? `Nenhum follow-up ${FILTER_LABELS[activeFilter].toLowerCase()}.`
                  : "Nenhum follow-up pendente. Registre atividades com próximos follow-ups nos negócios ou leads."
              }
              variant={activeFilter === "today" ? "success" : "default"}
            />
          ) : null}
        </>
      ) : null}

      {/* Activity dialog — register contact or reschedule */}
      {dialog ? (
        <ActivityFormDialog
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          initialType={dialog.mode === "register_contact" ? "call" : "follow_up"}
          leadId={dialog.leadId}
          dealId={dialog.dealId}
          pending={createMutation.isPending}
          error={createMutation.error}
          onSubmit={handleDialogSubmit}
        />
      ) : null}

      {/* Toast */}
      <ActionToast
        open={Boolean(toastMsg)}
        message={toastMsg ?? ""}
        onDismiss={() => setToastMsg(null)}
        autoHideMs={4000}
        tone="success"
      />
    </motion.div>
  )
}
