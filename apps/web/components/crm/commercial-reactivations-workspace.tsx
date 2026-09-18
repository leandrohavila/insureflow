"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { PermissionGate } from "@/components/auth/permission-gate"
import { Button, buttonVariants } from "@/components/ui/button"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { FilterChip } from "@/components/crm/primitives"
import { CRM_PAGE_SHELL } from "@/lib/crm/crm-layout-classes"
import { queryKeys } from "@/lib/data-access/query-keys"
import { fetchLeadLossReasons } from "@/lib/data-access/modules/lead-loss-reasons/api"
import {
  fetchReactivationQueue,
  postponeReactivation,
  reactivateLead,
  type ReactivationQueueItem,
  type ReactivationQueueWindow,
} from "@/lib/data-access/modules/commercial-reactivations/api"
import { cn } from "@/lib/utils"

const WINDOWS: { id: ReactivationQueueWindow; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "overdue", label: "Atrasadas" },
  { id: "next7", label: "Próximos 7 dias" },
]

function initialWindow(raw: string | null): ReactivationQueueWindow | "" {
  if (raw === "today" || raw === "overdue" || raw === "next7") return raw
  return "today"
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleDateString("pt-BR")
}

function formatRelative(value: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  const days = Math.floor(
    (Date.now() - parsed.getTime()) / (24 * 60 * 60 * 1000),
  )
  if (days <= 0) return "hoje"
  if (days === 1) return "há 1 dia"
  return `há ${days} dias`
}

export function CommercialReactivationsWorkspace() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [window, setWindow] = useState<ReactivationQueueWindow | "">(() =>
    initialWindow(searchParams.get("window")),
  )
  const [ownerUserId, setOwnerUserId] = useState("")
  const [lossReasonId, setLossReasonId] = useState("")
  const [source, setSource] = useState("")
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [postponeLead, setPostponeLead] = useState<ReactivationQueueItem | null>(
    null,
  )
  const [postponeDays, setPostponeDays] = useState<7 | 15 | 30 | "custom">(7)
  const [postponeAt, setPostponeAt] = useState("")
  const [postponeReason, setPostponeReason] = useState("")

  const query = useQuery({
    queryKey: queryKeys.commercialReactivations.list({
      window,
      ownerUserId,
      lossReasonId,
      source,
    }),
    queryFn: () =>
      fetchReactivationQueue({
        window: window || undefined,
        ownerUserId: ownerUserId || undefined,
        lossReasonId: lossReasonId || undefined,
        source: source.trim() || undefined,
        limit: 100,
      }),
  })

  const reasonsQuery = useQuery({
    queryKey: ["lead-loss-reasons", "active"],
    queryFn: () => fetchLeadLossReasons(true),
  })

  const items = useMemo(() => query.data?.data ?? [], [query.data?.data])
  const metrics = query.data?.metrics

  const owners = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of items) {
      if (item.ownerUserId && item.ownerName) {
        map.set(item.ownerUserId, item.ownerName)
      }
    }
    return Array.from(map.entries())
  }, [items])

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.commercialReactivations.all,
    })
    await queryClient.invalidateQueries({
      queryKey: queryKeys.commercialAgenda.all,
    })
  }

  async function onReactivate(item: ReactivationQueueItem) {
    setBusyId(item.id)
    setActionError(null)
    try {
      await reactivateLead(item.id, {
        notes: "Reativado pela fila operacional",
      })
      setActionMessage(`Lead ${item.name} reativado.`)
      await refresh()
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Falha ao reativar lead.",
      )
    } finally {
      setBusyId(null)
    }
  }

  async function onConfirmPostpone() {
    if (!postponeLead) return
    if (postponeReason.trim().length < 5) {
      setActionError("Informe o motivo do adiamento (mín. 5 caracteres).")
      return
    }
    setBusyId(postponeLead.id)
    setActionError(null)
    try {
      await postponeReactivation(postponeLead.id, {
        ...(postponeDays === "custom"
          ? { at: new Date(postponeAt).toISOString() }
          : { days: postponeDays }),
        reason: postponeReason.trim(),
      })
      setActionMessage(`Reativação de ${postponeLead.name} adiada.`)
      setPostponeLead(null)
      setPostponeReason("")
      await refresh()
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Falha ao adiar reativação.",
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className={CRM_PAGE_SHELL}>
      <CrmPageHeader
        badge="CRM"
        title="Reativações"
        description="Fila operacional — recuperar leads perdidos no momento certo."
      />

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Kpi label="Hoje" value={metrics?.today} loading={query.isLoading} />
        <Kpi
          label="Atrasadas"
          value={metrics?.overdue}
          loading={query.isLoading}
        />
        <Kpi
          label="Próximos 7 dias"
          value={metrics?.next7}
          loading={query.isLoading}
        />
      </div>

      {actionMessage ? (
        <p
          className="mb-3 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
          role="status"
        >
          {actionMessage}
        </p>
      ) : null}
      {actionError ? (
        <p
          className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}

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

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Responsável
          <select
            className="h-9 min-w-[10rem] rounded-md border border-white/10 bg-transparent px-2 text-sm text-foreground"
            value={ownerUserId}
            onChange={(event) => setOwnerUserId(event.target.value)}
          >
            <option value="">Todos</option>
            {owners.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Motivo
          <select
            className="h-9 min-w-[12rem] rounded-md border border-white/10 bg-transparent px-2 text-sm text-foreground"
            value={lossReasonId}
            onChange={(event) => setLossReasonId(event.target.value)}
          >
            <option value="">Todos</option>
            {(reasonsQuery.data ?? []).map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Origem
          <input
            className="h-9 min-w-[10rem] rounded-md border border-white/10 bg-transparent px-2 text-sm text-foreground"
            placeholder="Ex.: site, indicação"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Lead</th>
              <th className="px-3 py-2">Telefone</th>
              <th className="px-3 py-2">Responsável</th>
              <th className="px-3 py-2">Motivo da perda</th>
              <th className="px-3 py-2">Data prevista</th>
              <th className="px-3 py-2">Dias em atraso</th>
              <th className="px-3 py-2">Último contato</th>
              <th className="px-3 py-2">Próximo contato</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted-foreground">
                  Carregando fila de reativação…
                </td>
              </tr>
            ) : null}
            {!query.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted-foreground">
                  Nenhum lead nesta visão.
                </td>
              </tr>
            ) : null}
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "border-t border-white/[0.04]",
                  item.windowStatus === "overdue" &&
                    "bg-destructive/10 text-destructive",
                )}
              >
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td className="px-3 py-2 tabular-nums">{item.phone || "—"}</td>
                <td className="px-3 py-2">{item.ownerName || "—"}</td>
                <td className="px-3 py-2">
                  {item.lossReasonName || item.lostReason || "—"}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {formatDate(item.nextReactivationAt)}
                </td>
                <td className="px-3 py-2 tabular-nums">{item.daysOverdue}</td>
                <td className="px-3 py-2">
                  {formatRelative(item.lastContactAt)}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {formatDate(item.nextContactAt)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <Link
                      href={`/leads?lead=${item.id}`}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "ghost" }),
                      )}
                    >
                      Abrir Lead
                    </Link>
                    <PermissionGate permission="leads:manage">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === item.id}
                        onClick={() => onReactivate(item)}
                      >
                        Reativar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === item.id}
                        onClick={() => {
                          setPostponeLead(item)
                          setPostponeDays(7)
                          setPostponeAt("")
                          setPostponeReason("")
                          setActionError(null)
                        }}
                      >
                        Adiar
                      </Button>
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {postponeLead ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-background p-4 shadow-xl">
            <h2 className="text-base font-semibold">Adiar reativação</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {postponeLead.name} · prevista{" "}
              {formatDate(postponeLead.nextReactivationAt)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([7, 15, 30] as const).map((days) => (
                <FilterChip
                  key={days}
                  isActive={postponeDays === days}
                  label={`+${days} dias`}
                  onClick={() => setPostponeDays(days)}
                />
              ))}
              <FilterChip
                isActive={postponeDays === "custom"}
                label="Data personalizada"
                onClick={() => setPostponeDays("custom")}
              />
            </div>
            {postponeDays === "custom" ? (
              <input
                type="datetime-local"
                className="mt-3 h-9 w-full rounded-md border border-white/10 bg-transparent px-2 text-sm"
                value={postponeAt}
                onChange={(event) => setPostponeAt(event.target.value)}
              />
            ) : null}
            <label className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
              Motivo do adiamento *
              <textarea
                className="min-h-[4.5rem] rounded-md border border-white/10 bg-transparent px-2 py-1.5 text-sm text-foreground"
                value={postponeReason}
                onChange={(event) => setPostponeReason(event.target.value)}
                placeholder="Ex.: Cliente viajou; retomar na próxima quinzena"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setPostponeLead(null)}
                disabled={busyId === postponeLead.id}
              >
                Cancelar
              </Button>
              <Button
                onClick={onConfirmPostpone}
                disabled={
                  busyId === postponeLead.id ||
                  (postponeDays === "custom" && !postponeAt)
                }
              >
                Confirmar adiamento
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Kpi({
  label,
  value,
  loading,
}: {
  label: string
  value?: number
  loading?: boolean
}) {
  return (
    <div className="rounded-md border border-white/[0.06] px-3 py-2">
      <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">
        {loading ? "—" : (value ?? 0)}
      </p>
    </div>
  )
}
