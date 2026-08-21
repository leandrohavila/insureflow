"use client"

import { useMemo, useState } from "react"

import { DashboardKpiTile, DashboardKpiTileGrid } from "@/components/dashboard/dashboard-kpi-tile"
import { DataTable, FormSelect } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  COMMUNICATION_PURPOSE_LABELS,
  COMMUNICATION_PURPOSES,
  COMMUNICATION_STATUS_LABELS,
  COMMUNICATION_STATUSES,
  MESSAGE_CHANNEL_LABELS,
  MESSAGE_CHANNELS,
  type CommunicationPurpose,
  type CommunicationStatus,
  type MessageChannel,
} from "@/lib/business-units/constants"
import {
  useBusinessUnits,
} from "@/lib/data-access/modules/business-units"
import {
  useCommunications,
  useCommunicationsDashboard,
  useRecordCommunicationReply,
} from "@/lib/data-access/modules/communications"
import type { CommunicationLog } from "@/lib/data-access/modules/communications"
import { getErrorMessage } from "@/lib/data-access"
import { cn } from "@/lib/utils"

function formatWhen(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function defaultFrom() {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().slice(0, 10)
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10)
}

export function CommunicationDashboardWorkspace() {
  const [purpose, setPurpose] = useState<CommunicationPurpose | "">("")
  const [status, setStatus] = useState<CommunicationStatus | "">("")
  const [channel, setChannel] = useState<MessageChannel | "">("")
  const [businessUnitId, setBusinessUnitId] = useState("")
  const [userId, setUserId] = useState("")
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [page, setPage] = useState(1)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  const dashboardFilters = useMemo(
    () => ({
      purpose: purpose || undefined,
      businessUnitId: businessUnitId || undefined,
      userId: userId || undefined,
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    }),
    [purpose, businessUnitId, userId, from, to],
  )

  const filters = useMemo(
    () => ({
      ...dashboardFilters,
      status: status || undefined,
      channel: channel || undefined,
      page,
    }),
    [dashboardFilters, status, channel, page],
  )

  const dashboard = useCommunicationsDashboard(dashboardFilters)
  const logs = useCommunications(filters)
  const units = useBusinessUnits()
  const recordReply = useRecordCommunicationReply()

  const metrics = dashboard.data
  const rows = logs.data?.data ?? []
  const meta = logs.data?.meta

  return (
    <div className="space-y-6">
      <DashboardKpiTileGrid className="sm:grid-cols-3 lg:grid-cols-6">
        <DashboardKpiTile
          label="Enviadas"
          value={metrics?.sent ?? 0}
          loading={dashboard.isLoading}
        />
        <DashboardKpiTile
          label="Entregues"
          value={metrics?.delivered ?? 0}
          loading={dashboard.isLoading}
        />
        <DashboardKpiTile
          label="Lidas"
          value={metrics?.read ?? 0}
          loading={dashboard.isLoading}
          tone="primary"
        />
        <DashboardKpiTile
          label="Respondidas"
          value={metrics?.replied ?? 0}
          loading={dashboard.isLoading}
          tone="success"
        />
        <DashboardKpiTile
          label="Falhas"
          value={metrics?.failed ?? 0}
          loading={dashboard.isLoading}
          tone="danger"
        />
        <DashboardKpiTile
          label="Taxa de resposta"
          value={`${metrics?.replyRate ?? 0}%`}
          loading={dashboard.isLoading}
          tone="primary"
        />
      </DashboardKpiTileGrid>

      <p className="text-xs text-muted-foreground">
        Provider: {metrics?.provider ?? "—"}. Configure a Evolution em{" "}
        <a className="underline" href="/configuracoes/comunicacao">
          Configurações → Comunicação
        </a>
        .
      </p>

      {metrics?.byPurpose?.length ? (
        <div className="flex flex-wrap gap-2">
          {metrics.byPurpose.map((row) => (
            <span
              key={row.purpose}
              className="rounded-md border border-white/[0.08] px-3 py-1.5 text-xs text-muted-foreground"
            >
              {COMMUNICATION_PURPOSE_LABELS[row.purpose]}: {row.count}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Input
          type="date"
          className="w-40"
          value={from}
          onChange={(event) => {
            setFrom(event.target.value)
            setPage(1)
          }}
        />
        <Input
          type="date"
          className="w-40"
          value={to}
          onChange={(event) => {
            setTo(event.target.value)
            setPage(1)
          }}
        />
        <FormSelect
          className="w-48"
          value={businessUnitId}
          onChange={(event) => {
            setBusinessUnitId(event.target.value)
            setPage(1)
          }}
          options={[
            { value: "", label: "Todas as empresas" },
            ...(units.data ?? []).map((unit) => ({
              value: unit.id,
              label: unit.name,
            })),
          ]}
        />
        <FormSelect
          className="w-48"
          value={userId}
          onChange={(event) => {
            setUserId(event.target.value)
            setPage(1)
          }}
          options={[
            { value: "", label: "Todos os corretores" },
            ...(metrics?.brokers ?? []).map((broker) => ({
              value: broker.id,
              label: broker.name,
            })),
          ]}
        />
        <FormSelect
          className="w-44"
          value={purpose}
          onChange={(event) => {
            setPurpose(event.target.value as CommunicationPurpose | "")
            setPage(1)
          }}
          options={[
            { value: "", label: "Todos os tipos" },
            ...COMMUNICATION_PURPOSES.map((item) => ({
              value: item,
              label: COMMUNICATION_PURPOSE_LABELS[item],
            })),
          ]}
        />
        <FormSelect
          className="w-40"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as CommunicationStatus | "")
            setPage(1)
          }}
          options={[
            { value: "", label: "Todos os status" },
            ...COMMUNICATION_STATUSES.map((item) => ({
              value: item,
              label: COMMUNICATION_STATUS_LABELS[item],
            })),
          ]}
        />
        <FormSelect
          className="w-40"
          value={channel}
          onChange={(event) => {
            setChannel(event.target.value as MessageChannel | "")
            setPage(1)
          }}
          options={[
            { value: "", label: "Todos os canais" },
            ...MESSAGE_CHANNELS.map((item) => ({
              value: item,
              label: MESSAGE_CHANNEL_LABELS[item],
            })),
          ]}
        />
      </div>

      <DataTable
        data={rows}
        getRowId={(row) => row.id}
        loading={logs.isLoading}
        error={logs.error}
        emptyTitle="Nenhuma comunicação registrada"
        emptyDescription="Reativação, renovação e cross-sell passam por esta camada."
        onRetry={() => void logs.refetch()}
        pagination={
          meta
            ? {
                meta: { page: meta.page, totalPages: meta.totalPages, total: meta.total },
                onPageChange: setPage,
              }
            : undefined
        }
        columns={[
          {
            key: "when",
            header: "Quando",
            render: (row) => formatWhen(row.sentAt ?? row.createdAt),
          },
          {
            key: "purpose",
            header: "Tipo",
            render: (row) => COMMUNICATION_PURPOSE_LABELS[row.purpose],
          },
          {
            key: "channel",
            header: "Canal",
            render: (row) => MESSAGE_CHANNEL_LABELS[row.channel],
          },
          {
            key: "to",
            header: "Destinatário",
            render: (row) =>
              row.lead?.name ?? row.customer?.name ?? row.to,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => COMMUNICATION_STATUS_LABELS[row.status],
          },
          {
            key: "provider",
            header: "Provider",
            hideOnMobile: true,
            render: (row) => row.provider,
          },
        ]}
        rowActions={[
          {
            key: "reply",
            label: "Registrar resposta",
            hidden: (row: CommunicationLog) =>
              row.status === "replied" || row.direction !== "OUTBOUND",
            onSelect: (row) => {
              setReplyingId(row.id)
              setReplyContent("")
            },
          },
        ]}
      />

      {replyingId ? (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-sm font-medium">Registrar resposta recebida</p>
          <textarea
            className={cn(
              "mt-3 min-h-24 w-full rounded-md border border-input bg-popover px-3 py-2 text-sm",
            )}
            value={replyContent}
            onChange={(event) => setReplyContent(event.target.value)}
            placeholder="Texto da resposta do lead ou cliente"
          />
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              disabled={!replyContent.trim() || recordReply.isPending}
              onClick={() =>
                recordReply.mutate(
                  { id: replyingId, input: { content: replyContent } },
                  {
                    onSuccess: () => {
                      setReplyingId(null)
                      setReplyContent("")
                    },
                  },
                )
              }
            >
              Salvar resposta
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReplyingId(null)}
            >
              Cancelar
            </Button>
          </div>
          {recordReply.error ? (
            <p className="mt-2 text-xs text-destructive">
              {getErrorMessage(recordReply.error)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
