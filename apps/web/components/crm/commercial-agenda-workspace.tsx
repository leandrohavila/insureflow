"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { PermissionGate } from "@/components/auth/permission-gate"
import { Button, buttonVariants } from "@/components/ui/button"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { FilterChip } from "@/components/crm/primitives"
import { CRM_PAGE_SHELL } from "@/lib/crm/crm-layout-classes"
import { queryKeys } from "@/lib/data-access/query-keys"
import { updateActivity } from "@/lib/data-access/modules/activities"
import { updateLeadFollowUp } from "@/lib/data-access/modules/lead-follow-ups"
import {
  fetchCommercialAgenda,
  type CommercialAgendaItem,
  type CommercialAgendaType,
  type CommercialAgendaWindow,
} from "@/lib/data-access/modules/commercial-agenda/api"
import { cn } from "@/lib/utils"

const WINDOWS: { id: CommercialAgendaWindow; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "overdue", label: "Atrasados" },
  { id: "next7", label: "Próximos 7 dias" },
  { id: "next30", label: "Próximos 30 dias" },
]

const TYPES: { id: CommercialAgendaType | ""; label: string }[] = [
  { id: "", label: "Todos" },
  { id: "FOLLOW_UP", label: "Follow-up" },
  { id: "RENEWAL", label: "Renovação" },
  { id: "REACTIVATION", label: "Reativação" },
  { id: "SLA", label: "SLA" },
  { id: "CALL", label: "Ligação" },
  { id: "WHATSAPP", label: "WhatsApp" },
  { id: "EMAIL", label: "Email" },
  { id: "MEETING", label: "Reunião" },
  { id: "VISIT", label: "Visita" },
  { id: "TASK", label: "Tarefa" },
]

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

function statusLabel(status: string) {
  const key = status.toLowerCase()
  if (key === "pending") return "Pendente"
  if (key === "completed") return "Concluída"
  if (key === "canceled" || key === "cancelled") return "Cancelada"
  return status
}

function priorityLabel(priority: CommercialAgendaItem["priority"] | undefined) {
  if (priority === "high") return "Alta"
  if (priority === "medium") return "Média"
  return "Normal"
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
  const [window, setWindow] = useState<CommercialAgendaWindow>("today")
  const [type, setType] = useState<CommercialAgendaType | "">("")
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rescheduleAt, setRescheduleAt] = useState("")
  const query = useQuery({
    queryKey: queryKeys.commercialAgenda.list({ window, type }),
    queryFn: () => fetchCommercialAgenda({ window, type }),
  })
  const items = query.data?.data ?? []
  const metrics = query.data?.metrics

  async function complete(item: CommercialAgendaItem) {
    const parsed = parseAgendaItemId(item.id)
    if (!parsed) return

    if (parsed.source === "activity") {
      await updateActivity(parsed.id, { status: "completed" })
    } else {
      await updateLeadFollowUp(parsed.id, { status: "COMPLETED" })
    }
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
    await queryClient.invalidateQueries({
      queryKey: queryKeys.commercialAgenda.all,
    })
  }

  return (
    <div className={CRM_PAGE_SHELL}>
      <CrmPageHeader
        badge="CRM"
        title="Agenda comercial"
        description="Ligações, WhatsApp, follow-ups, visitas, reuniões e renovações em um só lugar."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-5">
        <Kpi label="Atividades hoje" value={metrics?.today} />
        <Kpi label="Atrasados" value={metrics?.overdue} />
        <Kpi label="Renovações próximas" value={metrics?.renewalsUpcoming} />
        <Kpi label="Follow-ups pendentes" value={metrics?.followUpsPending} />
        <Kpi label="Leads hoje" value={metrics?.leadsToday} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {WINDOWS.map((item) => (
          <FilterChip
            key={item.id}
            isActive={window === item.id}
            label={item.label}
            onClick={() => setWindow(item.id)}
          />
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((item) => (
          <FilterChip
            key={item.id || "all"}
            isActive={type === item.id}
            label={item.label}
            onClick={() => setType(item.id)}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Cliente/Lead</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Responsável</th>
              <th className="px-3 py-2">Data/Hora</th>
              <th className="px-3 py-2">Prioridade</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-muted-foreground">
                  Carregando agenda…
                </td>
              </tr>
            ) : null}
            {!query.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-muted-foreground">
                  Nenhuma atividade nesta visão.
                </td>
              </tr>
            ) : null}
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "border-t border-white/[0.04]",
                  (window === "overdue" || item.priority === "high") &&
                    "bg-destructive/10 text-destructive",
                )}
              >
                <td className="px-3 py-2">{partyName(item)}</td>
                <td className="px-3 py-2">{item.typeLabel}</td>
                <td className="px-3 py-2">{item.ownerName ?? "—"}</td>
                <td className="px-3 py-2">{formatDateTime(item.at)}</td>
                <td className="px-3 py-2">{priorityLabel(item.priority)}</td>
                <td className="px-3 py-2">{statusLabel(item.status)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <PermissionGate permission="crm:manage">
                      {item.source === "activity" || item.source === "follow_up" ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => complete(item)}
                          >
                            Concluir
                          </Button>
                          {rescheduleId === item.id ? (
                            <>
                              <input
                                type="datetime-local"
                                className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-xs"
                                value={rescheduleAt}
                                onChange={(event) =>
                                  setRescheduleAt(event.target.value)
                                }
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => confirmReschedule(item)}
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setRescheduleId(null)}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRescheduleId(item.id)
                                setRescheduleAt(toDatetimeLocal(item.at))
                              }}
                            >
                              Reagendar
                            </Button>
                          )}
                        </>
                      ) : null}
                    </PermissionGate>
                    {item.leadId ? (
                      <Link
                        href={`/leads?leadId=${item.leadId}`}
                        className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                      >
                        Abrir Lead
                      </Link>
                    ) : null}
                    {item.customerId ? (
                      <Link
                        href={`/clientes?customerId=${item.customerId}`}
                        className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                      >
                        Abrir Cliente
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] px-4 py-3">
      <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value ?? "—"}</p>
    </div>
  )
}
