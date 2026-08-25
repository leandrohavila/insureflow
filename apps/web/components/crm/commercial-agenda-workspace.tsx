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
  type CommercialAgendaType,
  type CommercialAgendaWindow,
} from "@/lib/data-access/modules/commercial-agenda/api"
import { cn } from "@/lib/utils"

const WINDOWS: { id: CommercialAgendaWindow; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "overdue", label: "Atrasadas" },
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
]

function formatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleDateString("pt-BR")
}

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
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
  const query = useQuery({
    queryKey: queryKeys.commercialAgenda.list({ window, type }),
    queryFn: () => fetchCommercialAgenda({ window, type }),
  })
  const items = query.data?.data ?? []
  const metrics = query.data?.metrics

  async function complete(item: (typeof items)[number]) {
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

  async function reschedule(item: (typeof items)[number]) {
    const parsed = parseAgendaItemId(item.id)
    if (!parsed) return

    const next = new Date()
    next.setDate(next.getDate() + 1)
    if (parsed.source === "activity") {
      await updateActivity(parsed.id, { nextFollowUpAt: next.toISOString() })
    } else {
      await updateLeadFollowUp(parsed.id, { scheduledAt: next.toISOString() })
    }
    await queryClient.invalidateQueries({
      queryKey: queryKeys.commercialAgenda.all,
    })
  }

  return (
    <div className={CRM_PAGE_SHELL}>
      <CrmPageHeader
        badge="CRM"
        title="Agenda comercial"
        description="Follow-ups, renovações, reativações e SLA do dia a dia."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-5">
        <Kpi label="Atividades hoje" value={metrics?.today} />
        <Kpi label="Atrasadas" value={metrics?.overdue} />
        <Kpi label="Renovações próximas" value={metrics?.renewalsUpcoming} />
        <Kpi label="Reativações pendentes" value={metrics?.reactivationsPending} />
        <Kpi label="SLA atrasados" value={metrics?.slaOverdue} />
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
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Hora</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Lead</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Responsável</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Origem</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted-foreground">
                  Carregando agenda…
                </td>
              </tr>
            ) : null}
            {!query.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted-foreground">
                  Nenhuma atividade nesta visão.
                </td>
              </tr>
            ) : null}
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/[0.04]">
                <td className="px-3 py-2">{formatDate(item.at)}</td>
                <td className="px-3 py-2">{formatTime(item.at)}</td>
                <td className="px-3 py-2">{item.customerName ?? "—"}</td>
                <td className="px-3 py-2">{item.leadName ?? "—"}</td>
                <td className="px-3 py-2">{item.typeLabel}</td>
                <td className="px-3 py-2">{item.ownerName ?? "—"}</td>
                <td className="px-3 py-2">{item.status}</td>
                <td className="px-3 py-2">{item.origin}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => reschedule(item)}
                          >
                            Reagendar
                          </Button>
                        </>
                      ) : null}
                    </PermissionGate>
                    {item.leadId ? (
                      <Link
                        href={`/leads?leadId=${item.leadId}`}
                        className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                      >
                        Lead
                      </Link>
                    ) : null}
                    {item.customerId ? (
                      <>
                        <Link
                          href={`/clientes?customerId=${item.customerId}`}
                          className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                        >
                          Cliente
                        </Link>
                        <Link
                          href={`/crm/customer-360/${item.customerId}`}
                          className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                        >
                          360
                        </Link>
                      </>
                    ) : null}
                    {item.dealId ? (
                      <Link
                        href={`/crm/negocios?dealId=${item.dealId}`}
                        className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                      >
                        Deal
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
