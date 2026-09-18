"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { QuoteComparisonTable } from "@/components/quotes/quote-comparison-table"
import { quoteWorkflowLabel } from "@/components/quotes/quote-status-labels"
import {
  ContentContainer,
  DataTable,
  PageContainer,
  type DataTableColumn,
} from "@/components/design-system"
import { dsContentLayoutVariant } from "@/lib/design-system"
import { StatusPill } from "@/components/crm/primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatSubmissionDate } from "@/components/questionnaires/questionnaire-answer-utils"
import {
  QUOTE_WORKFLOW_STATUSES,
  useQuoteComparison,
  useQuoteComparisons,
  type QuoteComparison,
  type QuoteComparisonListFilters,
  type QuoteWorkflowStatus,
} from "@/lib/data-access/modules/quotes"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

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

function parseReturnTo(searchParams: URLSearchParams) {
  const returnTo = searchParams.get("returnTo")
  return returnTo?.trim() || null
}

export function QuotesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialDealId = searchParams.get("dealId") ?? ""
  const initialLeadId = searchParams.get("leadId") ?? ""
  const initialComparisonId = searchParams.get("comparisonId") ?? ""
  const returnTo = parseReturnTo(searchParams)

  const [workflowStatus, setWorkflowStatus] = useState<
    QuoteWorkflowStatus | "all"
  >("all")
  const [dealId] = useState(initialDealId)
  const [leadId] = useState(initialLeadId)
  const [page, setPage] = useState(1)
  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(
    initialComparisonId || null,
  )

  const filters = useMemo<QuoteComparisonListFilters>(
    () => ({
      workflowStatus,
      dealId: dealId || undefined,
      leadId: leadId || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [dealId, leadId, page, workflowStatus],
  )

  const comparisonsQuery = useQuoteComparisons(filters)
  const comparisons = comparisonsQuery.data?.data ?? []
  const meta = comparisonsQuery.data?.meta

  const detailQuery = useQuoteComparison(selectedComparisonId)
  const selectedComparison = detailQuery.data

  useEffect(() => {
    setPage(1)
  }, [workflowStatus, dealId, leadId])

  useEffect(() => {
    if (initialComparisonId) {
      setSelectedComparisonId(initialComparisonId)
    }
  }, [initialComparisonId])

  const handleBack = useCallback(() => {
    if (returnTo) {
      router.push(returnTo)
      return
    }
    router.back()
  }, [returnTo, router])

  const columns = useMemo<DataTableColumn<QuoteComparison>[]>(
    () => [
      {
        key: "title",
        header: "Comparativo",
        render: (row) => (
          <div>
            <p className="font-medium tracking-[-0.02em]">
              {row.title ?? "Comparativo sem título"}
            </p>
            <p className="text-[10px] text-muted-foreground">{row.id}</p>
          </div>
        ),
      },
      {
        key: "context",
        header: "Vínculo",
        hideOnMobile: true,
        render: (row) => (
          <div className="text-sm">
            {row.deal ? (
              <p>{row.deal.title}</p>
            ) : row.lead ? (
              <p>{row.lead.name}</p>
            ) : (
              <p className="text-muted-foreground">Sem vínculo</p>
            )}
          </div>
        ),
      },
      {
        key: "lines",
        header: "Linhas",
        hideOnMobile: true,
        render: (row) => String(row.quotes.length),
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

  return (
    <PageContainer>
      <ContentContainer variant={dsContentLayoutVariant.quotations}>
        <CrmPageHeader
          badge="Comercial"
          title="Cotações"
          description="Comparativos de cotação, linhas por seguradora e propostas comerciais."
        >
          {returnTo ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleBack}
            >
              <ArrowLeft className="size-3.5" />
              Voltar ao CRM
            </Button>
          ) : null}
        </CrmPageHeader>

        {(dealId || leadId) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {dealId ? (
              <Badge variant="outline">Negócio: {dealId}</Badge>
            ) : null}
            {leadId ? (
              <Badge variant="outline">Lead: {leadId}</Badge>
            ) : null}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex min-w-[180px] flex-col gap-1">
            <label
              htmlFor="quote-workflow-filter"
              className="crm-text-meta text-foreground/65"
            >
              Status do fluxo
            </label>
            <select
              id="quote-workflow-filter"
              value={workflowStatus}
              onChange={(event) =>
                setWorkflowStatus(
                  event.target.value as QuoteWorkflowStatus | "all",
                )
              }
              className={cn(
                "h-9 rounded-md border border-input bg-background px-3 text-sm",
              )}
            >
              <option value="all">Todos</option>
              {QUOTE_WORKFLOW_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {quoteWorkflowLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <DataTable
            data={comparisons}
            columns={columns}
            getRowId={(row) => row.id}
            loading={comparisonsQuery.isLoading}
            loadingLabel="Carregando comparativos…"
            error={comparisonsQuery.error}
            errorTitle="Erro ao carregar comparativos"
            onRetry={() => void comparisonsQuery.refetch()}
            onRowClick={(row) => setSelectedComparisonId(row.id)}
            emptyTitle="Nenhum registro encontrado"
            emptyDescription="Clique em Novo para começar."
            pagination={
              meta
                ? {
                    meta: {
                      page: meta.page,
                      totalPages: meta.totalPages,
                      total: meta.total,
                    },
                    onPageChange: setPage,
                  }
                : undefined
            }
          />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium tracking-[-0.02em]">
                {selectedComparison
                  ? selectedComparison.title ?? "Detalhe do comparativo"
                  : "Selecione um comparativo"}
              </h3>
              {selectedComparison ? (
                <StatusPill
                  tone={WORKFLOW_TONE[selectedComparison.workflowStatus]}
                  variant="soft"
                  size="xs"
                >
                  {quoteWorkflowLabel(selectedComparison.workflowStatus)}
                </StatusPill>
              ) : null}
            </div>

            {selectedComparisonId ? (
              <QuoteComparisonTable
                lines={selectedComparison?.quotes ?? []}
                loading={detailQuery.isLoading}
                error={detailQuery.error}
                onRetry={() => void detailQuery.refetch()}
              />
            ) : (
              <p className="crm-text-meta rounded-lg border border-dashed px-4 py-8 text-center text-foreground/60">
                Selecione um comparativo na lista para ver as linhas de cotação.
              </p>
            )}
          </div>
        </div>
      </ContentContainer>
    </PageContainer>
  )
}
