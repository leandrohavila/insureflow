"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, MapPin } from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import {
  CrmBadge,
  CrmFilterChip,
  CrmFilterGroup,
  crmFilterCardClass,
  crmFilterFieldClass,
  crmStatCardClass,
} from "@/components/crm/crm-controls"
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
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import {
  DataTable,
  FilterSelect,
  FilterText,
  StatCard,
  type DataTableColumn,
} from "@/components/design-system"
import { Button, buttonVariants } from "@/components/ui/button"
import { CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL } from "@/lib/crm/crm-layout-classes"
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

const rowActionClass =
  "h-9 w-auto max-w-full min-w-0 justify-center gap-1.5 px-2.5! text-xs font-semibold"

const feedbackClass =
  "rounded-xl border px-3! py-2! text-sm font-medium"

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

  function closePostpone() {
    setPostponeLead(null)
    setActionError(null)
  }

  const columns: DataTableColumn<ReactivationQueueItem>[] = [
      {
        key: "lead",
        header: "Lead",
        className: "min-w-[8rem] font-semibold text-[#10294B]",
        render: (item) => item.name,
      },
      {
        key: "phone",
        header: "Telefone",
        className: "whitespace-nowrap tabular-nums",
        render: (item) => item.phone || "—",
      },
      {
        key: "owner",
        header: "Responsável",
        render: (item) => item.ownerName || "—",
      },
      {
        key: "reason",
        header: "Motivo da perda",
        render: (item) => item.lossReasonName || item.lostReason || "—",
      },
      {
        key: "expected",
        header: "Data prevista",
        className: "whitespace-nowrap tabular-nums",
        render: (item) => formatDate(item.nextReactivationAt),
      },
      {
        key: "overdue",
        header: "Dias em atraso",
        className: "whitespace-nowrap tabular-nums",
        render: (item) =>
          item.windowStatus === "overdue" ? (
            <CrmBadge tone="danger">{item.daysOverdue}</CrmBadge>
          ) : (
            item.daysOverdue
          ),
      },
      {
        key: "lastContact",
        header: "Último contato",
        className: "whitespace-nowrap",
        render: (item) => formatRelative(item.lastContactAt),
      },
      {
        key: "nextContact",
        header: "Próximo contato",
        className: "whitespace-nowrap tabular-nums",
        render: (item) => formatDate(item.nextContactAt),
      },
      {
        key: "actions",
        header: "Ações",
        className: "min-w-[15rem]",
        render: (item) => (
          <div className="flex flex-wrap items-center gap-[var(--if-layout-button-gap)]">
            <Link
              href={`/leads?lead=${item.id}`}
              className={cn(
                buttonVariants({ variant: "crmSecondary" }),
                rowActionClass,
              )}
            >
              Abrir Lead
            </Link>
            <PermissionGate permission="leads:manage">
              <Button
                type="button"
                variant="crmSecondary"
                className={rowActionClass}
                disabled={busyId === item.id}
                onClick={() => onReactivate(item)}
              >
                Reativar
              </Button>
              <Button
                type="button"
                variant="crmSecondary"
                className={rowActionClass}
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
        ),
      },
    ]

  return (
    <div className={cn(CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL)}>
      <CrmPageHeader
        badge="CRM"
        title="Reativações"
        description="Fila operacional — recuperar leads perdidos no momento certo."
      />

      <section
        className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3"
        aria-label="Indicadores de reativação"
      >
        <StatCard
          surface="light"
          density="compact"
          className={crmStatCardClass}
          label="Hoje"
          value={metrics?.today ?? 0}
          loading={query.isLoading}
        />
        <StatCard
          surface="light"
          density="compact"
          className={crmStatCardClass}
          label="Atrasadas"
          value={metrics?.overdue ?? 0}
          loading={query.isLoading}
        />
        <StatCard
          surface="light"
          density="compact"
          className={crmStatCardClass}
          label="Próximos 7 dias"
          value={metrics?.next7 ?? 0}
          loading={query.isLoading}
        />
      </section>

      {actionMessage ? (
        <p
          className={cn(
            feedbackClass,
            "border-[#BFD9C8] bg-[#E7F3EA] text-[#1F6B3A]",
          )}
          role="status"
        >
          {actionMessage}
        </p>
      ) : null}
      {actionError && !postponeLead ? (
        <p
          className={cn(
            feedbackClass,
            "border-[#E5C2BE] bg-[#F8E8E6] text-[#9F2D2D]",
          )}
          role="alert"
        >
          {actionError}
        </p>
      ) : null}

      <section
        className={cn(crmFilterCardClass, "flex min-w-0 flex-col gap-3")}
        aria-label="Filtros de reativação"
      >
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
        <div className="flex min-w-0 flex-wrap items-end gap-[var(--if-layout-control-gap)] border-t border-[#D6CFC4] pt-3">
          <FilterSelect
            showLabel
            label="Responsável"
            containerClassName="gap-2"
            className={cn(crmFilterFieldClass, "min-w-[10rem]")}
            value={ownerUserId}
            onChange={(event) => setOwnerUserId(event.target.value)}
            options={[
              { value: "", label: "Todos" },
              ...owners.map(([id, name]) => ({ value: id, label: name })),
            ]}
          />
          <FilterSelect
            showLabel
            label="Motivo"
            containerClassName="gap-2"
            className={cn(crmFilterFieldClass, "min-w-[12rem]")}
            value={lossReasonId}
            onChange={(event) => setLossReasonId(event.target.value)}
            options={[
              { value: "", label: "Todos" },
              ...(reasonsQuery.data ?? []).map((reason) => ({
                value: reason.id,
                label: reason.name,
              })),
            ]}
          />
          <FilterText
            showLabel
            label="Origem"
            containerClassName="gap-2"
            icon={<MapPin className="size-4" strokeWidth={1.75} />}
            className={cn(crmFilterFieldClass, "min-w-[12rem]")}
            placeholder="Ex.: site, indicação"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
        </div>
      </section>

      <DataTable
        density="default"
        className="w-full"
        cellClassName="px-2! py-3! align-middle whitespace-normal text-[#10294B]"
        headerCellClassName="px-2! whitespace-normal"
        tableClassName="w-full min-w-[1040px]"
        data={items}
        columns={columns}
        getRowId={(item) => item.id}
        getRowClassName={(item) =>
          item.windowStatus === "overdue" ? "bg-[#FDF4F2]" : undefined
        }
        loading={query.isLoading}
        loadingLabel="Carregando fila de reativação…"
        error={query.isError ? query.error : null}
        errorTitle="Não foi possível carregar a fila de reativação."
        onRetry={() => void query.refetch()}
        emptyIcon={CalendarClock}
        emptyTitle="Nenhum lead nesta visão."
        emptyDescription="Escolha outro período ou ajuste os filtros de responsável, motivo e origem."
      />

      {postponeLead ? (
        <CrmFormDrawer
          open
          onOpenChange={(open) => {
            if (!open && busyId !== postponeLead.id) closePostpone()
          }}
        >
          <form
            className="flex h-full min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              void onConfirmPostpone()
            }}
          >
            <CrmFormDrawerHeader
              icon={CalendarClock}
              title="Adiar reativação"
              description={`${postponeLead.name} · prevista ${formatDate(postponeLead.nextReactivationAt)}`}
            />
            <CrmFormDrawerBody className="gap-4 px-5! py-4!">
              <CrmFormDrawerSection title="Novo prazo" className="gap-4 p-4!">
                <CrmFilterGroup label="Prazo do adiamento">
                  {([7, 15, 30] as const).map((days) => (
                    <CrmFilterChip
                      key={days}
                      pressed={postponeDays === days}
                      onClick={() => setPostponeDays(days)}
                    >
                      {`+${days} dias`}
                    </CrmFilterChip>
                  ))}
                  <CrmFilterChip
                    pressed={postponeDays === "custom"}
                    onClick={() => setPostponeDays("custom")}
                  >
                    Data personalizada
                  </CrmFilterChip>
                </CrmFilterGroup>
                {postponeDays === "custom" ? (
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-[#5C6578]">
                      Data e horário
                    </span>
                    <input
                      type="datetime-local"
                      className={crmDrawerInputClass}
                      value={postponeAt}
                      onChange={(event) => setPostponeAt(event.target.value)}
                    />
                  </label>
                ) : null}
              </CrmFormDrawerSection>
              <CrmFormDrawerSection title="Justificativa" className="gap-4 p-4!">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#5C6578]">
                    Motivo do adiamento *
                  </span>
                  <textarea
                    className="min-h-[5.5rem] w-full rounded-lg border border-[#D6CFC4] bg-white px-3! py-2! text-sm text-[#10294B] outline-none placeholder:text-[#5C6578] focus-visible:border-[#10294B] focus-visible:ring-2 focus-visible:ring-[#10294B]/20"
                    value={postponeReason}
                    onChange={(event) => setPostponeReason(event.target.value)}
                    placeholder="Ex.: Cliente viajou; retomar na próxima quinzena"
                  />
                </label>
              </CrmFormDrawerSection>
              {actionError ? (
                <p
                  className={cn(
                    feedbackClass,
                    "border-[#E5C2BE] bg-[#F8E8E6] text-[#9F2D2D]",
                  )}
                  role="alert"
                >
                  {actionError}
                </p>
              ) : null}
            </CrmFormDrawerBody>
            <CrmFormDrawerFooter>
              <CrmFormDrawerCancel
                disabled={busyId === postponeLead.id}
                onClick={closePostpone}
              />
              <CrmFormDrawerSubmit
                pending={busyId === postponeLead.id}
                disabled={postponeDays === "custom" && !postponeAt}
              >
                Confirmar adiamento
              </CrmFormDrawerSubmit>
            </CrmFormDrawerFooter>
          </form>
        </CrmFormDrawer>
      ) : null}
    </div>
  )
}
