"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  AlarmClock,
  CalendarClock,
  Check,
  ClipboardCheck,
  ListFilter,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  RotateCw,
  SquarePen,
  UserRound,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ActivityFormDialog } from "@/components/activities/activity-form-dialog"
import { PermissionGate } from "@/components/auth/permission-gate"
import { CrmFilterChip, CrmFilterGroup } from "@/components/crm/crm-controls"
import {
  CrmFormDrawer,
  CrmFormDrawerBody,
  CrmFormDrawerCancel,
  CrmFormDrawerFooter,
  CrmFormDrawerHeader,
  CrmFormDrawerSection,
  CrmFormDrawerSubmit,
  crmDrawerInputClass,
} from "@/components/crm/crm-form-drawer"
import { ErrorState, LoadingState } from "@/components/design-system"
import { Button, buttonVariants } from "@/components/ui/button"
import { CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL } from "@/lib/crm/crm-layout-classes"
import { COMMERCIAL_AUTO_REFRESH_MS } from "@/lib/crm/commercial-auto-refresh"
import { getErrorMessage } from "@/lib/data-access"
import { queryKeys } from "@/lib/data-access/query-keys"
import {
  useCreateActivity,
  updateActivity,
  type ActivityType,
  type CreateActivityInput,
} from "@/lib/data-access/modules/activities"
import { updateLeadFollowUp } from "@/lib/data-access/modules/lead-follow-ups"
import {
  fetchCommercialAgenda,
  type CommercialAgendaItem,
  type CommercialAgendaType,
  type CommercialAgendaWindow,
} from "@/lib/data-access/modules/commercial-agenda/api"
import { activityKindColors, activityKindFromActivityType, activityKindFromAgendaType, type ActivityVisualKind } from "@/lib/crm/activity-kind-colors"
import { cn } from "@/lib/utils"

const WINDOWS: { id: CommercialAgendaWindow; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "overdue", label: "Atrasados" },
  { id: "next7", label: "Próximos 7 dias" },
  { id: "next30", label: "Próximos 30 dias" },
  { id: "future", label: "Futuras" },
]

function initialAgendaWindow(raw: string | null): CommercialAgendaWindow {
  if (
    raw === "today" ||
    raw === "overdue" ||
    raw === "next7" ||
    raw === "next30" ||
    raw === "future"
  ) {
    return raw
  }
  return "today"
}

const TYPES: {
  id: CommercialAgendaType | ""
  label: string
  icon: LucideIcon
}[] = [
  { id: "", label: "Todos", icon: ListFilter },
  { id: "FOLLOW_UP", label: "Follow-up", icon: RotateCw },
  { id: "RENEWAL", label: "Renovação", icon: RefreshCw },
  { id: "REACTIVATION", label: "Reativação", icon: UserRoundCheck },
  { id: "SLA", label: "SLA", icon: AlarmClock },
  { id: "CALL", label: "Ligação", icon: Phone },
  { id: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { id: "EMAIL", label: "E-mail", icon: Mail },
  { id: "MEETING", label: "Reunião", icon: Users },
  { id: "VISIT", label: "Visita", icon: MapPin },
  { id: "TASK", label: "Tarefa", icon: ClipboardCheck },
]

const QUICK_ACTIONS: { type: ActivityType; label: string; icon: LucideIcon }[] = [
  { type: "call", label: "Ligar", icon: Phone },
  { type: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { type: "email", label: "Enviar e-mail", icon: Mail },
  { type: "meeting", label: "Agendar reunião", icon: Users },
  { type: "visit", label: "Agendar visita", icon: MapPin },
  { type: "task", label: "Criar tarefa", icon: ClipboardCheck },
  { type: "follow_up", label: "Novo follow-up", icon: RotateCw },
]

function AgendaKindIcon({
  kind,
  icon: Icon,
}: {
  kind: ActivityVisualKind
  icon: LucideIcon
}) {
  const color = activityKindColors[kind]
  return (
    <span
      className="agenda-icon"
      style={{
        ["--agenda-icon" as string]: color.icon,
        ["--agenda-icon-surface" as string]: color.surface,
      }}
    >
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
    </span>
  )
}
function TypeBadge({ type, label }: { type: string; label: string }) {
  const icon = TYPES.find((item) => item.id === type)?.icon ?? ListFilter
  return (
    <span className="agenda-badge agenda-type-badge">
      <AgendaKindIcon kind={activityKindFromAgendaType(type)} icon={icon} />
      {label}
    </span>
  )
}

function formatDateTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return `${parsed.toLocaleDateString("pt-BR")} ${parsed.toLocaleTimeString(
    "pt-BR",
    { hour: "2-digit", minute: "2-digit" },
  )}`
}

function partyName(item: CommercialAgendaItem) {
  if (item.customerName && item.leadName && item.customerName !== item.leadName) {
    return `${item.customerName} · ${item.leadName}`
  }
  return item.customerName ?? item.leadName ?? "—"
}

function Clip({ value }: { value: string }) {
  return (
    <span className="block max-w-[16rem] truncate" title={value}>
      {value}
    </span>
  )
}

function statusLabel(status: string) {
  const key = status.toLowerCase()
  if (key === "pending") return "Pendente"
  if (key === "completed") return "Concluída"
  if (key === "canceled" || key === "cancelled") return "Cancelada"
  if (key === "overdue") return "Atrasada"
  return status
}

function priorityLabel(priority: CommercialAgendaItem["priority"] | undefined) {
  if (priority === "high") return "Alta"
  if (priority === "medium") return "Média"
  return "Baixa"
}

function toDatetimeLocal(iso: string) {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ""
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

/** Parses composite agenda ids (`activity:<id>` | `follow_up:<id>`). */
function parseAgendaItemId(
  compositeId: string,
): { source: "activity" | "follow_up"; id: string } | null {
  if (!compositeId) return null

  const separatorIndex = compositeId.indexOf(":")
  if (separatorIndex <= 0 || separatorIndex >= compositeId.length - 1) {
    return null
  }

  const source = compositeId.slice(0, separatorIndex)
  const id = compositeId.slice(separatorIndex + 1).trim()
  if (!id) return null

  if (source === "activity" || source === "follow_up") {
    return { source, id }
  }

  return null
}

export function CommercialAgendaWorkspace() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [window, setWindow] = useState<CommercialAgendaWindow>(() =>
    initialAgendaWindow(searchParams.get("window")),
  )
  const [type, setType] = useState<CommercialAgendaType | "">("")
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rescheduleAt, setRescheduleAt] = useState("")
  const [resultId, setResultId] = useState<string | null>(null)
  const [resultText, setResultText] = useState("")
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [createMode, setCreateMode] = useState<ActivityType | null>(null)
  const createActivity = useCreateActivity({})
  const query = useQuery({
    queryKey: queryKeys.commercialAgenda.list({ window, type }),
    queryFn: () => fetchCommercialAgenda({ window, type }),
    refetchInterval: COMMERCIAL_AUTO_REFRESH_MS,
  })
  const items = query.data?.data ?? []
  const metrics = query.data?.metrics

  async function complete(item: CommercialAgendaItem, outcome?: string) {
    const parsed = parseAgendaItemId(item.id)
    if (!parsed) return

    if (parsed.source === "activity") {
      await updateActivity(parsed.id, {
        status: "completed",
        ...(outcome ? { outcome } : {}),
      })
    } else {
      await updateLeadFollowUp(parsed.id, {
        status: "COMPLETED",
        ...(outcome ? { notes: outcome } : {}),
      })
    }
    setResultId(null)
    setResultText("")
    setActionMessage("Atividade concluída.")
    await queryClient.invalidateQueries({
      queryKey: queryKeys.commercialAgenda.all,
    })
  }

  async function confirmReschedule(item: CommercialAgendaItem) {
    const parsed = parseAgendaItemId(item.id)
    if (!parsed || !rescheduleAt) return
    const next = new Date(rescheduleAt).toISOString()
    if (parsed.source === "activity") {
      await updateActivity(parsed.id, { nextFollowUpAt: next })
    } else {
      await updateLeadFollowUp(parsed.id, { scheduledAt: next })
    }
    setRescheduleId(null)
    setActionMessage("Reagendado.")
    await queryClient.invalidateQueries({
      queryKey: queryKeys.commercialAgenda.all,
    })
  }

  const periodLabel = WINDOWS.find((item) => item.id === window)?.label ?? "Hoje"

  function openCreate(mode: ActivityType) {
    setCreateMode(mode)
  }

  function submitCreate(input: CreateActivityInput) {
    const label = QUICK_ACTIONS.find((action) => action.type === createMode)?.label
    createActivity.mutate(input, {
      onSuccess: () => {
        setCreateMode(null)
        setActionMessage(label ? `${label} registrada.` : "Atividade criada.")
      },
    })
  }

  const createLabel = QUICK_ACTIONS.find((action) => action.type === createMode)?.label
  const rescheduleItem = items.find((item) => item.id === rescheduleId) ?? null
  const resultItem = items.find((item) => item.id === resultId) ?? null

  return (
    <div className={cn(CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL, "avila-agenda-surface")}>
      <header className="agenda-masthead shrink-0">
        <div>
          <p className="agenda-masthead__eyebrow">CRM</p>
          <h1>Agenda Comercial</h1>
          <p className="agenda-masthead__subtitle">
            Gestão de ligações, WhatsApp, follow-ups, visitas, reuniões e renovações.
          </p>
        </div>
      </header>

      <PermissionGate permission="crm:manage">
        <div className="flex min-w-0 flex-wrap gap-2" role="group" aria-label="Ações rápidas">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.type}
                type="button"
                variant="crmSecondary"
                title={action.label}
                onClick={() => openCreate(action.type)}
              >
                <AgendaKindIcon kind={activityKindFromActivityType(action.type)} icon={Icon} />
                {action.label}
              </Button>
            )
          })}
        </div>
      </PermissionGate>

      <section
        className="grid min-w-0 grid-cols-2 gap-3 min-[768px]:grid-cols-3 min-[1280px]:grid-cols-6"
        aria-label="Indicadores operacionais"
      >
        <Kpi label="Atividades hoje" value={metrics?.today} loading={query.isLoading} />
        <Kpi
          label="Atividades atrasadas"
          value={metrics?.overdue}
          loading={query.isLoading}
        />
        <Kpi
          label="Follow-ups pendentes"
          value={metrics?.followUpsPending}
          loading={query.isLoading}
        />
        <Kpi
          label="Renovações próximas"
          value={metrics?.renewalsUpcoming}
          loading={query.isLoading}
        />
        <Kpi
          label="Reativações hoje"
          value={metrics?.reactivationsToday}
          loading={query.isLoading}
          href="/crm/reativacoes?window=today"
        />
        <Kpi
          label="Reativações atrasadas"
          value={metrics?.reactivationsOverdue}
          loading={query.isLoading}
          href="/crm/reativacoes?window=overdue"
        />
      </section>

      {actionMessage ? (
        <p className="agenda-status" role="status">
          {actionMessage}
        </p>
      ) : null}

      <section className="agenda-bars" aria-label="Filtros da agenda">
        <CrmFilterGroup label="Período">
          {WINDOWS.map((item) => (
            <CrmFilterChip
              key={item.id}
              pressed={window === item.id}
              onClick={() => setWindow(item.id)}
            >
              {item.label}
            </CrmFilterChip>
          ))}
        </CrmFilterGroup>
        <CrmFilterGroup
          label="Tipo de atividade"
          className="border-t border-[#D6CFC4] pt-3"
        >
          {TYPES.map((item) => {
            const Icon = item.icon
            const selected = type === item.id
            const kind = activityKindFromAgendaType(item.id)
            return (
              <CrmFilterChip
                key={item.id || "all"}
                pressed={selected}
                title={item.label}
                onClick={() => setType(item.id)}
              >
                <Icon
                  className="size-3.5 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                  style={selected ? undefined : { color: activityKindColors[kind].icon }}
                />
                {item.label}
              </CrmFilterChip>
            )
          })}
        </CrmFilterGroup>
      </section>

      <section className="agenda-work" aria-label="Lista de atividades">
        {query.isLoading ? (
          <div className="agenda-state">
            <LoadingState label="Carregando agenda…" />
          </div>
        ) : null}
        {query.isError ? (
          <div className="agenda-state">
            <ErrorState
              title="Não foi possível carregar a agenda."
              description={getErrorMessage(query.error, "Erro ao carregar as atividades.")}
              onRetry={() => void query.refetch()}
            />
          </div>
        ) : null}
        {!query.isLoading && !query.isError && items.length === 0 ? (
          <div className="agenda-state">
            <p className="text-base font-semibold text-[var(--avila-navy-900)]">
              Nenhuma atividade em {periodLabel.toLowerCase()}.
            </p>
            <p className="agenda-muted mt-2 max-w-xl text-sm leading-relaxed">
              Crie uma atividade ou escolha outro período. Os indicadores acima
              consideram a carteira inteira; esta lista mostra apenas o período
              e o tipo selecionados.
            </p>
            {type || ((metrics?.overdue ?? 0) > 0 && window !== "overdue") ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {type ? (
                  <Button type="button" variant="crmSecondary" onClick={() => setType("")}>
                    Ver todos os tipos
                  </Button>
                ) : null}
                {(metrics?.overdue ?? 0) > 0 && window !== "overdue" ? (
                  <Button type="button" variant="crmSecondary" onClick={() => setWindow("overdue")}>
                    Ver atrasados
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {!query.isLoading && !query.isError && items.length > 0 ? (
          <div className="agenda-table-scroll">
            <table className="agenda-table">
              <thead>
                <tr>
                  <th>Data e horário</th>
                  <th>Cliente/Lead</th>
                  <th>Tipo</th>
                  <th>Motivo</th>
                  <th>Responsável</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const party = partyName(item)
                  const origin = item.origin || "—"
                  const owner = item.ownerName ?? "—"
                  return (
                    <tr key={item.id}>
                      <td className="tabular-nums whitespace-nowrap">{formatDateTime(item.at)}</td>
                      <td>
                        <Clip value={party} />
                      </td>
                      <td>
                        <TypeBadge type={item.type} label={item.typeLabel} />
                      </td>
                      <td>
                        <Clip value={origin} />
                      </td>
                      <td>
                        <Clip value={owner} />
                      </td>
                      <td>
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <AgendaActions
                          item={item}
                          onComplete={complete}
                          onStartReschedule={(current) => {
                            setResultId(null)
                            setResultText("")
                            setRescheduleId(current.id)
                            setRescheduleAt(toDatetimeLocal(current.at))
                          }}
                          onStartResult={(current) => {
                            setRescheduleId(null)
                            setRescheduleAt("")
                            setResultId(current.id)
                            setResultText("")
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {createMode ? (
        <ActivityFormDialog
          open
          onOpenChange={(open) => {
            if (!open) setCreateMode(null)
          }}
          initialType={createMode ?? undefined}
          presentation="drawer"
          title={createLabel ?? "Nova atividade"}
          description="Confirme o tipo, o vínculo e o horário."
          pending={createActivity.isPending}
          error={createActivity.error}
          onSubmit={submitCreate}
        />
      ) : null}

      {rescheduleItem ? (
        <CrmFormDrawer
          open
          onOpenChange={(open) => {
            if (!open) {
              setRescheduleId(null)
              setRescheduleAt("")
            }
          }}
        >
          <form
            className="flex h-full min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              void confirmReschedule(rescheduleItem)
            }}
          >
            <CrmFormDrawerHeader
              icon={CalendarClock}
              title="Reagendar atividade"
              description={partyName(rescheduleItem)}
            />
            <CrmFormDrawerBody className="gap-4 px-5! py-4!">
              <CrmFormDrawerSection title="Novo horário" className="gap-4 p-4!">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#5C6578]">
                    Data e horário
                  </span>
                  <input
                    type="datetime-local"
                    className={crmDrawerInputClass}
                    value={rescheduleAt}
                    required
                    onChange={(event) => setRescheduleAt(event.target.value)}
                  />
                </label>
              </CrmFormDrawerSection>
            </CrmFormDrawerBody>
            <CrmFormDrawerFooter>
              <CrmFormDrawerCancel
                onClick={() => {
                  setRescheduleId(null)
                  setRescheduleAt("")
                }}
              />
              <CrmFormDrawerSubmit disabled={!rescheduleAt}>
                Salvar
              </CrmFormDrawerSubmit>
            </CrmFormDrawerFooter>
          </form>
        </CrmFormDrawer>
      ) : null}

      {resultItem ? (
        <CrmFormDrawer
          open
          onOpenChange={(open) => {
            if (!open) {
              setResultId(null)
              setResultText("")
            }
          }}
        >
          <form
            className="flex h-full min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              void complete(resultItem, resultText.trim() || undefined)
            }}
          >
            <CrmFormDrawerHeader
              icon={SquarePen}
              title="Registrar resultado"
              description={partyName(resultItem)}
            />
            <CrmFormDrawerBody className="gap-4 px-5! py-4!">
              <CrmFormDrawerSection title="Resultado do contato" className="gap-4 p-4!">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#5C6578]">
                    Resultado
                  </span>
                  <input
                    className={crmDrawerInputClass}
                    placeholder="Resultado do contato"
                    value={resultText}
                    onChange={(event) => setResultText(event.target.value)}
                  />
                </label>
              </CrmFormDrawerSection>
            </CrmFormDrawerBody>
            <CrmFormDrawerFooter>
              <CrmFormDrawerCancel
                onClick={() => {
                  setResultId(null)
                  setResultText("")
                }}
              />
              <CrmFormDrawerSubmit>Salvar</CrmFormDrawerSubmit>
            </CrmFormDrawerFooter>
          </form>
        </CrmFormDrawer>
      ) : null}
    </div>
  )
}

const kpiClassName =
  "flex min-h-[4.75rem] min-w-0 flex-col justify-center gap-2 rounded-xl border border-[#D6CFC4] bg-white px-3.5! py-3! text-[#10294B] shadow-[0_1px_2px_rgb(16_41_75/0.04)]"

function Kpi({
  label,
  value,
  loading,
  href,
}: {
  label: string
  value?: number
  loading?: boolean
  href?: string
}) {
  const body = (
    <>
      <p className="text-xs font-medium text-[#5C6578]">{label}</p>
      <p className="text-2xl font-semibold leading-none tracking-tight text-[#10294B] tabular-nums">
        {loading ? "—" : (value ?? 0)}
      </p>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          kpiClassName,
          "transition-colors hover:border-[#C09048] focus-visible:ring-2 focus-visible:ring-[#10294B]/30 focus-visible:outline-none",
        )}
        title="Abrir Reativações"
      >
        {body}
      </Link>
    )
  }

  return <article className={kpiClassName}>{body}</article>
}

function statusTone(status: string) {
  const key = status.toLowerCase()
  if (key === "completed") return "success"
  if (key === "overdue") return "danger"
  if (key === "canceled" || key === "cancelled") return "neutral"
  if (key === "pending") return "info"
  return "neutral"
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("agenda-badge", `agenda-badge--${statusTone(status)}`)}>
      {statusLabel(status)}
    </span>
  )
}

function PriorityBadge({
  priority,
}: {
  priority: CommercialAgendaItem["priority"] | undefined
}) {
  const tone =
    priority === "high" ? "danger" : priority === "medium" ? "warn" : "success"
  return (
    <span className={cn("agenda-badge", `agenda-badge--${tone}`)}>
      {priorityLabel(priority)}
    </span>
  )
}

const agendaActionClass =
  "h-9 w-auto max-w-full min-w-0 justify-center gap-1.5 px-2.5! text-xs font-semibold"

function AgendaActions({
  item,
  onComplete,
  onStartReschedule,
  onStartResult,
}: {
  item: CommercialAgendaItem
  onComplete: (item: CommercialAgendaItem, outcome?: string) => void
  onStartReschedule: (item: CommercialAgendaItem) => void
  onStartResult: (item: CommercialAgendaItem) => void
}) {
  return (
    <div className="agenda-actions">
      <PermissionGate permission="crm:manage">
        {item.source === "activity" || item.source === "follow_up" ? (
          <>
            <Button
              type="button"
              variant="crmSecondary"
              className={agendaActionClass}
              title="Concluir"
              onClick={() => onComplete(item)}
            >
              <Check className="size-3.5 shrink-0" aria-hidden />
              Concluir
            </Button>
            <Button
              type="button"
              variant="crmSecondary"
              className={agendaActionClass}
              title="Reagendar"
              onClick={() => onStartReschedule(item)}
            >
              <CalendarClock className="size-3.5 shrink-0" aria-hidden />
              Reagendar
            </Button>
            <Button
              type="button"
              variant="crmSecondary"
              className={agendaActionClass}
              title="Registrar resultado"
              onClick={() => onStartResult(item)}
            >
              <SquarePen className="size-3.5 shrink-0" aria-hidden />
              Registrar resultado
            </Button>
          </>
        ) : null}
      </PermissionGate>
      {item.leadId ? (
        <Link
          href={`/leads?lead=${item.leadId}`}
          title="Abrir Lead"
          className={cn(buttonVariants({ variant: "crmSecondary" }), agendaActionClass)}
        >
          <UserRound className="size-3.5 shrink-0" aria-hidden />
          Abrir Lead
        </Link>
      ) : null}
      {item.customerId ? (
        <Link
          href={`/clientes?customerId=${item.customerId}`}
          title="Abrir Cliente"
          className={cn(buttonVariants({ variant: "crmSecondary" }), agendaActionClass)}
        >
          <UserRoundCheck className="size-3.5 shrink-0" aria-hidden />
          Abrir Cliente
        </Link>
      ) : null}
    </div>
  )
}
