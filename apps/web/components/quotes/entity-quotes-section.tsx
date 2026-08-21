"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, FileSpreadsheet, Loader2, Plus } from "lucide-react"

import { SectionPanel, StatusPill } from "@/components/crm/primitives"
import {
  PropertyCell,
  PropertyGrid,
} from "@/components/crm/sheet-sections/sheet-shared"
import { QuoteComparisonTable } from "@/components/quotes/quote-comparison-table"
import { quoteWorkflowLabel } from "@/components/quotes/quote-status-labels"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatSubmissionDate } from "@/components/questionnaires/questionnaire-answer-utils"
import type { CrmDealQuoteSummary } from "@/lib/data-access/modules/crm"
import {
  useCustomerQuoteComparisons,
  useDealQuoteComparisons,
  useLeadQuoteComparisons,
  useQuoteComparison,
  type QuoteWorkflowStatus,
} from "@/lib/data-access/modules/quotes"
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

type EntityQuotesSectionProps = {
  returnTo: string
  quoteSummary?: CrmDealQuoteSummary | null
  leadId?: string | null
  dealId?: string | null
  customerId?: string | null
}

function buildQuotesHref(input: {
  leadId?: string | null
  dealId?: string | null
  customerId?: string | null
  returnTo: string
}) {
  const params = new URLSearchParams()
  if (input.leadId) params.set("leadId", input.leadId)
  if (input.dealId) params.set("dealId", input.dealId)
  if (input.customerId) params.set("customerId", input.customerId)
  params.set("returnTo", input.returnTo)
  return `/cotacoes?${params.toString()}`
}

export function EntityQuotesSection({
  returnTo,
  quoteSummary = null,
  leadId = null,
  dealId = null,
  customerId = null,
}: EntityQuotesSectionProps) {
  const router = useRouter()
  const dealListQuery = useDealQuoteComparisons(dealId, {
    limit: 5,
    enabled: Boolean(dealId),
  })
  const leadListQuery = useLeadQuoteComparisons(leadId, {
    limit: 5,
    enabled: Boolean(leadId) && !dealId,
  })
  const customerListQuery = useCustomerQuoteComparisons(customerId, {
    limit: 5,
    enabled: Boolean(customerId) && !dealId && !leadId,
  })

  const listQuery = dealId
    ? dealListQuery
    : leadId
      ? leadListQuery
      : customerListQuery

  const comparisons = listQuery.data?.data ?? []
  const primaryComparison = comparisons[0] ?? null

  const detailQuery = useQuoteComparison(primaryComparison?.id ?? null)
  const comparison = detailQuery.data ?? primaryComparison

  const quotesHref = buildQuotesHref({ leadId, dealId, customerId, returnTo })

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel title="Resumo comercial" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={FileSpreadsheet}
            label="Status do comparativo"
            value={
              quoteSummary ? (
                <StatusPill
                  tone={
                    WORKFLOW_TONE[
                      quoteSummary.workflowStatus as QuoteWorkflowStatus
                    ] ?? "neutral"
                  }
                  variant="soft"
                  size="sm"
                >
                  {quoteWorkflowLabel(quoteSummary.workflowStatus)}
                </StatusPill>
              ) : primaryComparison ? (
                <StatusPill
                  tone={WORKFLOW_TONE[primaryComparison.workflowStatus]}
                  variant="soft"
                  size="sm"
                >
                  {quoteWorkflowLabel(primaryComparison.workflowStatus)}
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
            value={
              quoteSummary
                ? String(quoteSummary.lineCount)
                : comparison
                  ? String(comparison.quotes.length)
                  : "—"
            }
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={FileSpreadsheet}
            label="Cotação selecionada"
            value={
              quoteSummary
                ? quoteSummary.hasSelectedQuote
                  ? "Sim"
                  : "Não"
                : comparison?.selectedQuoteId
                  ? "Sim"
                  : "Não"
            }
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={FileSpreadsheet}
            label="Atualizado em"
            value={formatSubmissionDate(
              quoteSummary?.updatedAt ?? comparison?.updatedAt,
            )}
            className="bg-[var(--crm-surface-panel)]"
          />
        </PropertyGrid>
      </SectionPanel>

      <SectionPanel
        title="Comparativo de cotações"
        tone="default"
        density="compact"
      >
        {listQuery.isLoading ? (
          <p className="crm-text-meta flex items-center gap-1.5 px-3 py-4 text-foreground/55">
            <Loader2 className="size-3.5 animate-spin" />
            Carregando comparativos…
          </p>
        ) : comparison ? (
          <QuoteComparisonTable
            lines={comparison.quotes}
            loading={detailQuery.isLoading}
            error={detailQuery.error}
            onRetry={() => void detailQuery.refetch()}
            density="compact"
          />
        ) : (
          <p className="crm-text-meta px-3 py-4 text-foreground/65">
            Nenhum comparativo vinculado.
          </p>
        )}
      </SectionPanel>

      <SectionPanel title="Ações de cotação" tone="default" density="compact">
        <div className="flex flex-col gap-2 px-1.5 pb-1 pt-1">
          <Link
            href={quotesHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full justify-start gap-2",
            )}
          >
            <ArrowUpRight className="size-3.5" />
            Abrir módulo de cotações
          </Link>
          {comparison ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() =>
                router.push(`${quotesHref}&comparisonId=${comparison.id}`)
              }
            >
              <FileSpreadsheet className="size-3.5" />
              Ver comparativo atual
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => router.push(quotesHref)}
            >
              <Plus className="size-3.5" />
              Criar comparativo
            </Button>
          )}
        </div>
      </SectionPanel>
    </div>
  )
}
