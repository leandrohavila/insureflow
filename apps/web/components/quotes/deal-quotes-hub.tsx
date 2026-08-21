"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  CheckCircle2,
  Edit3,
  FileSpreadsheet,
  Loader2,
  Plus,
  Send,
} from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import { SectionPanel, StatusPill } from "@/components/crm/primitives"
import {
  PropertyCell,
  PropertyGrid,
} from "@/components/crm/sheet-sections/sheet-shared"
import { QuoteComparisonDrawer } from "@/components/quotes/quote-comparison-drawer"
import { QuoteComparisonTable } from "@/components/quotes/quote-comparison-table"
import { QuoteLineDrawer } from "@/components/quotes/quote-line-drawer"
import { quoteWorkflowLabel } from "@/components/quotes/quote-status-labels"
import { DataTable, type DataTableColumn } from "@/components/design-system"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatSubmissionDate } from "@/components/questionnaires/questionnaire-answer-utils"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import {
  useDealQuoteComparisons,
  useMarkComparisonSent,
  useQuoteComparison,
  useSelectQuoteLine,
  type QuoteComparison,
  type QuoteLine,
  type QuoteWorkflowStatus,
} from "@/lib/data-access/modules/quotes"
import { DEAL_WORKSPACE_QUOTES_LIMIT } from "@/lib/data-access/modules/quotes/constants"
import { cn } from "@/lib/utils"

const WORKFLOW_TONE: Record<
  QuoteWorkflowStatus,
  "neutral" | "info" | "success" | "warn" | "danger" | "violet"
> = {
  received: "neutral",
  in_analysis: "warn",
  quote_created: "info",
  quote_sent: "info",
  negotiation: "violet",
  closed_won: "success",
  closed_lost: "danger",
}

type DealQuotesHubProps = {
  deal: CrmDeal
  crmReturnHref?: string
}

function buildQuotesHref(dealId: string, returnTo: string) {
  const params = new URLSearchParams()
  params.set("dealId", dealId)
  params.set("returnTo", returnTo)
  return `/cotacoes?${params.toString()}`
}

export function DealQuotesHub({ deal, crmReturnHref }: DealQuotesHubProps) {
  const returnTo = crmReturnHref ?? `/crm/negocios?deal=${deal.id}`
  const leadId = deal.convertedLead?.id ?? null
  const quoteSummary = deal.commercialContext?.quote ?? null

  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(
    quoteSummary?.comparisonId ?? null,
  )
  const [comparisonDrawer, setComparisonDrawer] = useState<
    "create" | "edit" | null
  >(null)
  const [lineDrawer, setLineDrawer] = useState<"create" | "edit" | null>(null)
  const [editingLine, setEditingLine] = useState<QuoteLine | null>(null)

  const listQuery = useDealQuoteComparisons(deal.id, {
    limit: DEAL_WORKSPACE_QUOTES_LIMIT,
  })
  const comparisons = listQuery.data?.data ?? []
  const firstComparisonId = comparisons[0]?.id ?? null

  const detailQuery = useQuoteComparison(selectedComparisonId)
  const selectedComparison = detailQuery.data ?? null

  const selectLine = useSelectQuoteLine()
  const markSent = useMarkComparisonSent()

  const isBusy =
    selectLine.isPending ||
    markSent.isPending ||
    detailQuery.isFetching

  useEffect(() => {
    if (selectedComparisonId) return
    if (quoteSummary?.comparisonId) {
      setSelectedComparisonId(quoteSummary.comparisonId)
      return
    }
    if (firstComparisonId) {
      setSelectedComparisonId(firstComparisonId)
    }
  }, [firstComparisonId, quoteSummary?.comparisonId, selectedComparisonId])

  const handleComparisonCreated = useCallback((comparison: QuoteComparison) => {
    setSelectedComparisonId(comparison.id)
  }, [])

  const handleSelectWinner = useCallback(
    (line: QuoteLine) => {
      if (!selectedComparisonId || line.isSelected) return
      selectLine.mutate({
        comparisonId: selectedComparisonId,
        quoteId: line.id,
      })
    },
    [selectLine, selectedComparisonId],
  )

  const handleMarkSent = useCallback(() => {
    if (!selectedComparisonId) return
    markSent.mutate(selectedComparisonId)
  }, [markSent, selectedComparisonId])

  const comparisonColumns = useMemo<DataTableColumn<QuoteComparison>[]>(
    () => [
      {
        key: "title",
        header: "Comparativo",
        render: (row) => (
          <div>
            <p className="font-medium tracking-[-0.02em]">
              {row.title ?? "Sem título"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {row.quotes.length} linha(s)
            </p>
          </div>
        ),
      },
      {
        key: "workflowStatus",
        header: "Status",
        render: (row) => (
          <StatusPill
            tone={WORKFLOW_TONE[row.workflowStatus]}
            variant="soft"
            size="xs"
          >
            {quoteWorkflowLabel(row.workflowStatus)}
          </StatusPill>
        ),
      },
      {
        key: "updatedAt",
        header: "Atualizado",
        hideOnMobile: true,
        render: (row) => formatSubmissionDate(row.updatedAt),
      },
    ],
    [],
  )

  const lineRowActions = useMemo(
    () => [
      {
        key: "select",
        label: "Selecionar vencedora",
        icon: CheckCircle2,
        permission: "quotes:manage" as const,
        hidden: (row: QuoteLine) => row.isSelected,
        onSelect: handleSelectWinner,
      },
      {
        key: "edit",
        label: "Editar linha",
        icon: Edit3,
        permission: "quotes:manage" as const,
        onSelect: (row: QuoteLine) => {
          setEditingLine(row)
          setLineDrawer("edit")
        },
      },
    ],
    [handleSelectWinner],
  )

  const activeWorkflowStatus =
    selectedComparison?.workflowStatus ??
    (quoteSummary?.workflowStatus as QuoteWorkflowStatus | undefined)

  const activeLineCount =
    selectedComparison?.quotes.length ?? quoteSummary?.lineCount ?? 0

  const hasSelectedQuote =
    selectedComparison?.selectedQuoteId != null ||
    quoteSummary?.hasSelectedQuote === true

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel title="Resumo comercial" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={FileSpreadsheet}
            label="Status do comparativo"
            value={
              activeWorkflowStatus ? (
                <StatusPill
                  tone={WORKFLOW_TONE[activeWorkflowStatus] ?? "neutral"}
                  variant="soft"
                  size="sm"
                >
                  {quoteWorkflowLabel(activeWorkflowStatus)}
                </StatusPill>
              ) : (
                "Sem comparativo"
              )
            }
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={FileSpreadsheet}
            label="Linhas cotadas"
            value={String(activeLineCount)}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={FileSpreadsheet}
            label="Cotação selecionada"
            value={hasSelectedQuote ? "Sim" : "Não"}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={FileSpreadsheet}
            label="Atualizado em"
            value={formatSubmissionDate(
              selectedComparison?.updatedAt ?? quoteSummary?.updatedAt,
            )}
            className="bg-[var(--crm-surface-panel)]"
          />
        </PropertyGrid>
      </SectionPanel>

      <SectionPanel
        title="Comparativos do negócio"
        tone="default"
        density="compact"
        action={
          <PermissionGate permission="quotes:manage">
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setComparisonDrawer("create")}
            >
              <Plus className="size-3.5" />
              Nova cotação
            </Button>
          </PermissionGate>
        }
      >
        {listQuery.isLoading ? (
          <p className="crm-text-meta flex items-center gap-1.5 px-3 py-4 text-foreground/55">
            <Loader2 className="size-3.5 animate-spin" />
            Carregando comparativos…
          </p>
        ) : (
          <DataTable
            data={comparisons}
            columns={comparisonColumns}
            getRowId={(row) => row.id}
            loading={false}
            onRowClick={(row) => setSelectedComparisonId(row.id)}
            density="compact"
            emptyTitle="Nenhum comparativo vinculado"
            emptyDescription="Crie uma nova cotação para registrar opções de seguradoras neste negócio."
            emptyAction={
              <PermissionGate permission="quotes:manage">
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setComparisonDrawer("create")}
                >
                  <Plus className="size-3.5" />
                  Nova cotação
                </Button>
              </PermissionGate>
            }
          />
        )}
      </SectionPanel>

      {selectedComparisonId ? (
        <SectionPanel
          title={
            selectedComparison?.title ??
            "Comparativo de seguradoras"
          }
          tone="default"
          density="compact"
          action={
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedComparison ? (
                <StatusPill
                  tone={WORKFLOW_TONE[selectedComparison.workflowStatus]}
                  variant="soft"
                  size="xs"
                >
                  {quoteWorkflowLabel(selectedComparison.workflowStatus)}
                </StatusPill>
              ) : null}
              <PermissionGate permission="quotes:manage">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setComparisonDrawer("edit")}
                  disabled={!selectedComparison}
                >
                  <Edit3 className="size-3.5" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setEditingLine(null)
                    setLineDrawer("create")
                  }}
                  disabled={!selectedComparison}
                >
                  <Plus className="size-3.5" />
                  Seguradora
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleMarkSent}
                  disabled={
                    isBusy ||
                    !selectedComparison ||
                    selectedComparison.quotes.length === 0 ||
                    selectedComparison.workflowStatus === "quote_sent"
                  }
                >
                  <Send className="size-3.5" />
                  Enviar
                </Button>
              </PermissionGate>
            </div>
          }
        >
          <QuoteComparisonTable
            lines={selectedComparison?.quotes ?? []}
            loading={detailQuery.isLoading}
            error={detailQuery.error}
            onRetry={() => void detailQuery.refetch()}
            density="compact"
            rowActions={lineRowActions}
          />
        </SectionPanel>
      ) : null}

      <SectionPanel title="Módulo completo" tone="default" density="compact">
        <div className="flex flex-col gap-2 px-1.5 pb-1 pt-1">
          <Link
            href={buildQuotesHref(deal.id, returnTo)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full justify-start gap-2",
            )}
          >
            <ArrowUpRight className="size-3.5" />
            Abrir central de cotações
          </Link>
        </div>
      </SectionPanel>

      <QuoteComparisonDrawer
        open={comparisonDrawer === "create"}
        onOpenChange={(open) => setComparisonDrawer(open ? "create" : null)}
        mode="create"
        dealId={deal.id}
        leadId={leadId}
        onSuccess={handleComparisonCreated}
      />

      <QuoteComparisonDrawer
        open={comparisonDrawer === "edit"}
        onOpenChange={(open) => setComparisonDrawer(open ? "edit" : null)}
        mode="edit"
        dealId={deal.id}
        leadId={leadId}
        comparison={selectedComparison}
      />

      {selectedComparisonId ? (
        <QuoteLineDrawer
          open={lineDrawer === "create"}
          onOpenChange={(open) => setLineDrawer(open ? "create" : null)}
          mode="create"
          comparisonId={selectedComparisonId}
        />
      ) : null}

      {selectedComparisonId && editingLine ? (
        <QuoteLineDrawer
          open={lineDrawer === "edit"}
          onOpenChange={(open) => {
            setLineDrawer(open ? "edit" : null)
            if (!open) setEditingLine(null)
          }}
          mode="edit"
          comparisonId={selectedComparisonId}
          line={editingLine}
        />
      ) : null}
    </div>
  )
}
