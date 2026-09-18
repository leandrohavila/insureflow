"use client"

import { useMemo } from "react"
import { CheckCircle2 } from "lucide-react"

import { StatusPill } from "@/components/crm/primitives"
import {
  DataTable,
  type DataTableColumn,
  type DataTableRowAction,
} from "@/components/design-system"
import { formatCurrency } from "@/lib/data-access/modules/crm"
import type { QuoteLine } from "@/lib/data-access/modules/quotes"

import { quoteLineStatusLabel } from "./quote-status-labels"

const LINE_STATUS_TONE: Record<
  QuoteLine["status"],
  "neutral" | "info" | "success" | "warn" | "danger"
> = {
  draft: "neutral",
  quoted: "info",
  sent: "info",
  selected: "success",
  rejected: "danger",
  expired: "warn",
}

export type QuoteComparisonTableProps = {
  lines: QuoteLine[]
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  onSelectLine?: (line: QuoteLine) => void
  selectable?: boolean
  rowActions?: DataTableRowAction<QuoteLine>[]
  density?: "default" | "compact"
  emptyTitle?: string
  emptyDescription?: string
}

function formatCoverages(coverages: string[]) {
  if (coverages.length === 0) return "—"
  if (coverages.length <= 2) return coverages.join(", ")
  return `${coverages.slice(0, 2).join(", ")} +${coverages.length - 2}`
}

export function QuoteComparisonTable({
  lines,
  loading,
  error,
  onRetry,
  onSelectLine,
  selectable = false,
  rowActions,
  density = "compact",
  emptyTitle = "Nenhuma linha de cotação",
  emptyDescription = "Adicione seguradoras ao comparativo para visualizar opções lado a lado.",
}: QuoteComparisonTableProps) {
  const columns = useMemo<DataTableColumn<QuoteLine>[]>(
    () => [
      {
        key: "insurer",
        header: "Seguradora",
        render: (row) => (
          <div>
            <p className="font-medium tracking-[-0.02em]">{row.insurer}</p>
            {row.product ? (
              <p className="text-[10px] text-muted-foreground">{row.product}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: "plan",
        header: "Plano",
        hideOnMobile: true,
        render: (row) => row.plan ?? "—",
      },
      {
        key: "coverages",
        header: "Coberturas",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-muted-foreground">
            {formatCoverages(row.coverages)}
          </span>
        ),
      },
      {
        key: "franchise",
        header: "Franquia",
        hideOnMobile: true,
        render: (row) =>
          row.franchiseValue != null
            ? formatCurrency(row.franchiseValue)
            : "—",
      },
      {
        key: "assistance",
        header: "Assistência",
        hideOnMobile: true,
        render: (row) => row.assistance ?? "—",
      },
      {
        key: "premium",
        header: "Valor",
        render: (row) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(row.premiumValue)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <StatusPill
            tone={LINE_STATUS_TONE[row.status]}
            variant="soft"
            size="xs"
          >
            {quoteLineStatusLabel(row.status)}
          </StatusPill>
        ),
      },
      {
        key: "selected",
        header: "Selecionada",
        render: (row) =>
          row.isSelected ? (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Sim
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  )

  return (
    <DataTable
      data={lines}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      loadingLabel="Carregando linhas de cotação…"
      error={error}
      errorTitle="Erro ao carregar cotações"
      onRetry={onRetry}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      onRowClick={selectable ? onSelectLine : undefined}
      rowActions={rowActions}
      density={density}
      stickyHeader
    />
  )
}
