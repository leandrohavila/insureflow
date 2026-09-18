"use client"

import { useCallback, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion, useReducedMotion } from "framer-motion"
import {
  AlarmClock,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Loader2,
} from "lucide-react"

import { ActivityFormDialog } from "@/components/activities/activity-form-dialog"
import { ActionToast } from "@/components/shared/action-toast"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import {
  CrmOperationalEmptyState,
  CrmSectionLoading,
} from "@/components/crm/interaction"
import { MetricStrip } from "@/components/crm/primitives"
import {
  TaskQuickActionsBar,
} from "@/components/crm/task-workspace/task-quick-actions-bar"
import { TaskSection } from "@/components/crm/task-workspace/task-section"
import { TaskToolbar } from "@/components/crm/task-workspace/task-toolbar"
import {
  classifyFollowUpStatus,
  derivePriority,
  getCompletedTaskFilters,
  getPendingTaskFilters,
  taskMatchesSearch,
  type EnrichedTask,
  TASK_FILTER_LABELS,
  type TaskFilter,
} from "@/components/crm/task-workspace/task-workspace-utils"
import { CRM_PAGE_SHELL } from "@/lib/crm/crm-layout-classes"
import { crmPageEnter } from "@/lib/crm/crm-motion"
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  pickActivityRelationFields,
  type Activity,
  type ActivityListResponse,
  type CreateActivityInput,
} from "@/lib/data-access/modules/activities"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import { useLeads } from "@/lib/data-access/modules/leads"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useCrmPersistedValue } from "@/lib/hooks/use-crm-workspace-preferences"
import { queryKeys } from "@/lib/data-access/query-keys"
import { cn } from "@/lib/utils"

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

function enrichActivity(
  activity: Activity,
  dealsMap: Map<string, { title: string; company: string }>,
  leadsMap: Map<string, { name: string; company: string | null | undefined }>,
  forceCompleted = false,
): EnrichedTask {
  let entityTitle = "Sem vínculo"
  let entityType: EnrichedTask["entityType"] = "unknown"
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

  if (forceCompleted || activity.status === "completed") {
    return {
      activity,
      entityTitle,
      entityType,
      entityId,
      entityCompany,
      status: "completed",
      sortDate: new Date(activity.updatedAt),
      priority: "baixa",
    }
  }

  if (!activity.nextFollowUpAt) {
    return {
      activity,
      entityTitle,
      entityType,
      entityId,
      entityCompany,
      status: "undated",
      sortDate: new Date(activity.occurredAt),
      priority: derivePriority("undated", activity.type),
    }
  }

  const status = classifyFollowUpStatus(activity.nextFollowUpAt)
  return {
    activity,
    entityTitle,
    entityType,
    entityId,
    entityCompany,
    status,
    sortDate: new Date(activity.nextFollowUpAt),
    priority: derivePriority(status, activity.type),
  }
}

const TASK_FILTER_IDS = Object.keys(TASK_FILTER_LABELS) as TaskFilter[]

function isTaskFilter(value: string): value is TaskFilter {
  return TASK_FILTER_IDS.includes(value as TaskFilter)
}

export function TasksPage() {
  const reduce = useReducedMotion()
  const queryClient = useQueryClient()

  const [pendingFilters] = useState(() => getPendingTaskFilters())
  const [completedFilters] = useState(() => getCompletedTaskFilters())

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 200)
  const [activeFilter, setActiveFilter] = useCrmPersistedValue(
    "tasks.filter",
    isTaskFilter,
  )
  const taskFilter: TaskFilter = isTaskFilter(activeFilter)
    ? activeFilter
    : "all"
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const pendingQuery = useActivities(pendingFilters)
  const completedQuery = useActivities(completedFilters)
  const dealsQuery = useCrmDeals()
  const leadsQuery = useLeads({ limit: 100 })

  const createMutation = useCreateActivity({})
  const updateMutation = useUpdateActivity({})

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

  const pendingTasks = useMemo(() => {
    return (pendingQuery.data?.data ?? [])
      .filter((a) => a.status === "pending")
      .map((a) => enrichActivity(a, dealsMap, leadsMap))
      .filter((task) => taskMatchesSearch(task, debouncedSearch))
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
  }, [pendingQuery.data?.data, dealsMap, leadsMap, debouncedSearch])

  const completedTasks = useMemo(() => {
    return (completedQuery.data?.data ?? [])
      .map((a) => enrichActivity(a, dealsMap, leadsMap, true))
      .filter((task) => taskMatchesSearch(task, debouncedSearch))
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
  }, [completedQuery.data?.data, dealsMap, leadsMap, debouncedSearch])

  const overdueItems = useMemo(
    () => pendingTasks.filter((t) => t.status === "overdue"),
    [pendingTasks],
  )
  const todayItems = useMemo(
    () => pendingTasks.filter((t) => t.status === "today"),
    [pendingTasks],
  )
  const upcomingItems = useMemo(
    () =>
      pendingTasks.filter(
        (t) => t.status === "upcoming" || t.status === "undated",
      ),
    [pendingTasks],
  )

  const filterCounts: Record<TaskFilter, number> = {
    all: pendingTasks.length + completedTasks.length,
    overdue: overdueItems.length,
    today: todayItems.length,
    completed: completedTasks.length,
  }

  const showOverdue = taskFilter === "all" || taskFilter === "overdue"
  const showToday = taskFilter === "all" || taskFilter === "today"
  const showUpcoming = taskFilter === "all"
  const showCompleted = taskFilter === "all" || taskFilter === "completed"

  const visibleOverdue = showOverdue ? overdueItems : []
  const visibleToday = showToday ? todayItems : []
  const visibleUpcoming = showUpcoming ? upcomingItems : []
  const visibleCompleted = showCompleted ? completedTasks : []

  const noItems =
    visibleOverdue.length === 0 &&
    visibleToday.length === 0 &&
    visibleUpcoming.length === 0 &&
    visibleCompleted.length === 0

  const removeFromPendingCaches = useCallback(
    (activityId: string) => {
      queryClient.setQueryData<ActivityListResponse>(
        queryKeys.activities.list(pendingFilters),
        (current) => {
          if (!current) return current
          return { ...current, data: current.data.filter((a) => a.id !== activityId) }
        },
      )
    },
    [queryClient, pendingFilters],
  )

  const prependToCompletedCache = useCallback(
    (activity: Activity) => {
      queryClient.setQueryData<ActivityListResponse>(
        queryKeys.activities.list(completedFilters),
        (current) => {
          if (!current) return current
          const completed = { ...activity, status: "completed" as const, nextFollowUpAt: null }
          return {
            ...current,
            data: [completed, ...current.data.filter((a) => a.id !== activity.id)].slice(
              0,
              completedFilters.limit,
            ),
          }
        },
      )
    },
    [queryClient, completedFilters],
  )

  function handleRegisterContact(task: EnrichedTask) {
    setDialog({
      mode: "register_contact",
      originalId: task.activity.id,
      leadId: task.activity.leadId,
      dealId: task.activity.dealId,
      customerId: task.activity.customerId,
      policyId: task.activity.policyId,
    })
  }

  function handleReschedule(task: EnrichedTask) {
    setDialog({
      mode: "reschedule",
      originalId: task.activity.id,
      leadId: task.activity.leadId,
      dealId: task.activity.dealId,
      customerId: task.activity.customerId,
      policyId: task.activity.policyId,
    })
  }

  function handleComplete(activity: Activity) {
    setCompletingId(activity.id)
    removeFromPendingCaches(activity.id)

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
        onSuccess: (activity) => {
          prependToCompletedCache(activity)
          setToastMsg("Tarefa concluída")
        },
        onError: () => {
          void pendingQuery.refetch()
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
      removeFromPendingCaches(originalId)
      updateMutation.mutate(
        {
          id: originalId,
          input: { status: "completed", nextFollowUpAt: null, ...rel },
        },
        {
          onSuccess: (activity) => {
            prependToCompletedCache(activity)
            setToastMsg(msg)
          },
          onError: () => {
            void pendingQuery.refetch()
          },
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
            completeOriginal(currentDialog.originalId, "Contato registrado")
          },
        },
      )
    } else {
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
            completeOriginal(currentDialog.originalId, "Tarefa reagendada")
          },
        },
      )
    }
  }

  const isLoading =
    pendingQuery.isLoading ||
    completedQuery.isLoading ||
    dealsQuery.isLoading ||
    leadsQuery.isLoading

  const isFetching =
    pendingQuery.isFetching ||
    completedQuery.isFetching

  const isMutating = createMutation.isPending || updateMutation.isPending

  const sectionHandlers = {
    onComplete: handleComplete,
    onRegisterContact: handleRegisterContact,
    onReschedule: handleReschedule,
    completingId,
  }

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={crmPageEnter}
      className={cn(CRM_PAGE_SHELL, "gap-5")}
    >
      <CrmPageHeader
        badge="Execução"
        title="Central de Tarefas"
        description="Inbox operacional — execute follow-ups, contatos e reuniões com prioridade e contexto comercial."
      >
        {(isFetching && !isLoading) || isMutating ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            {isMutating ? "Salvando…" : "Atualizando…"}
          </span>
        ) : null}
      </CrmPageHeader>

      <MetricStrip density="compact" className="min-w-0 shrink-0">
        <MetricStrip.Item
          label="Atrasadas"
          value={overdueItems.length}
          tone={overdueItems.length > 0 ? "danger" : "neutral"}
          icon={AlarmClock}
        />
        <MetricStrip.Item
          label="Hoje"
          value={todayItems.length}
          tone={todayItems.length > 0 ? "info" : "neutral"}
          icon={CalendarDays}
        />
        <MetricStrip.Item
          label="Próximas"
          value={upcomingItems.length}
          tone="neutral"
          icon={CalendarClock}
        />
        <MetricStrip.Item
          label="Concluídas"
          value={completedTasks.length}
          tone="success"
          icon={CheckCircle2}
        />
      </MetricStrip>

      <TaskQuickActionsBar className="shrink-0" />

      <TaskToolbar
        search={search}
        onSearchChange={setSearch}
        activeFilter={taskFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
      />

      <CrmSectionLoading
        isLoading={isLoading}
        label="Carregando tarefas…"
        rows={5}
      />

      {!isLoading ? (
        <div className="task-workspace-body crm-scroll-region flex min-h-0 min-w-0 flex-1 flex-col gap-5 pb-1">
          {showOverdue ? (
            <TaskSection
              title="Atrasadas"
              icon={AlarmClock}
              iconClass="text-rose-400"
              items={visibleOverdue}
              emptyLabel="Nenhuma tarefa atrasada."
              delay={0.04}
              {...sectionHandlers}
            />
          ) : null}

          {showToday ? (
            <TaskSection
              title="Hoje"
              icon={CalendarDays}
              iconClass="text-sky-400"
              items={visibleToday}
              emptyLabel="Nada para hoje — inbox limpa."
              delay={0.08}
              {...sectionHandlers}
            />
          ) : null}

          {showUpcoming ? (
            <TaskSection
              title="Próximas"
              icon={CalendarClock}
              iconClass="text-amber-300/90"
              items={visibleUpcoming}
              emptyLabel="Nenhuma tarefa agendada."
              delay={0.12}
              {...sectionHandlers}
            />
          ) : null}

          {showCompleted ? (
            <TaskSection
              title="Concluídas"
              icon={CheckCircle2}
              iconClass="text-emerald-400"
              items={visibleCompleted}
              emptyLabel="Nenhuma tarefa concluída recentemente."
              delay={0.16}
              completed
              {...sectionHandlers}
            />
          ) : null}

          {noItems ? (
            <CrmOperationalEmptyState
              icon={CalendarCheck2}
              title="Inbox vazia"
              hint={
                debouncedSearch
                  ? "Nenhuma tarefa corresponde à busca."
                  : taskFilter !== "all"
                    ? `Nenhuma tarefa em «${TASK_FILTER_LABELS[taskFilter]}».`
                    : "Registre atividades com follow-up nos negócios ou leads, ou use as ações rápidas acima."
              }
              variant={
                taskFilter === "today" && !debouncedSearch ? "success" : "default"
              }
            />
          ) : null}
        </div>
      ) : null}

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
