"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileDown,
  FileText,
  Loader2,
  Send,
  TimerOff,
} from "lucide-react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { StatusPill } from "@/components/crm/primitives"
import {
  PROPOSAL_STATUS_TONE,
  proposalStatusLabel,
} from "@/components/quotes/quote-status-labels"
import {
  ContentContainer,
  DataTable,
  PageContainer,
  type DataTableColumn,
} from "@/components/design-system"
import { dsContentLayoutVariant } from "@/lib/design-system"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatSubmissionDate } from "@/components/questionnaires/questionnaire-answer-utils"
import {
  getProposalPdfDownloadUrl,
  useGenerateProposalPdf,
  useMarkProposalExpired,
  useMarkProposalSent,
  useMarkProposalViewed,
  useProposals,
  useUpdateProposal,
  type ProposalListFilters,
  type ProposalListItem,
  type ProposalStatus,
  PROPOSAL_STATUSES,
} from "@/lib/data-access/modules/quotes"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

function entityLabel(proposal: ProposalListItem) {
  return (
    proposal.customer?.name ??
    proposal.lead?.name ??
    proposal.deal?.title ??
    "—"
  )
}

export function ProposalsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLeadId = searchParams.get("leadId") ?? ""
  const initialDealId = searchParams.get("dealId") ?? ""
  const initialCustomerId = searchParams.get("customerId") ?? ""
  const returnTo = searchParams.get("returnTo")?.trim() || null

  const [status, setStatus] = useState<ProposalStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filters = useMemo<ProposalListFilters>(
    () => ({
      status,
      leadId: initialLeadId || undefined,
      dealId: initialDealId || undefined,
      customerId: initialCustomerId || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [initialCustomerId, initialDealId, initialLeadId, page, status],
  )

  const listQuery = useProposals(filters)
  const proposals = listQuery.data?.data ?? []
  const selected =
    proposals.find((item) => item.id === selectedId) ?? proposals[0] ?? null

  const generatePdf = useGenerateProposalPdf()
  const markSent = useMarkProposalSent()
  const markViewed = useMarkProposalViewed()
  const markExpired = useMarkProposalExpired()
  const updateProposal = useUpdateProposal()

  const isBusy =
    generatePdf.isPending ||
    markSent.isPending ||
    markViewed.isPending ||
    markExpired.isPending ||
    updateProposal.isPending

  const columns = useMemo<DataTableColumn<ProposalListItem>[]>(
    () => [
      {
        key: "title",
        header: "Proposta",
        render: (row) => row.title ?? "Proposta comercial",
      },
      {
        key: "entity",
        header: "Cliente / Lead",
        hideOnMobile: true,
        render: (row) => entityLabel(row),
      },
      {
        key: "insurer",
        header: "Seguradora",
        hideOnMobile: true,
        render: (row) => row.quote?.insurer ?? "—",
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <StatusPill
            tone={PROPOSAL_STATUS_TONE[row.status]}
            variant="soft"
            size="xs"
          >
            {proposalStatusLabel(row.status)}
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
          title="Centro de Propostas"
          description="Gestão do ciclo comercial — PDF, envio, visualização, aceite e expiração."
        >
          {returnTo ? (
            <Link
              href={returnTo}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
            >
              <ArrowLeft className="size-3.5" />
              Voltar
            </Link>
          ) : null}
        </CrmPageHeader>

        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={status === "all" ? "default" : "outline"}
            onClick={() => {
              setStatus("all")
              setPage(1)
            }}
          >
            Todas
          </Button>
          {PROPOSAL_STATUSES.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={status === item ? "default" : "outline"}
              onClick={() => {
                setStatus(item)
                setPage(1)
              }}
            >
              {proposalStatusLabel(item)}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <DataTable
            columns={columns}
            data={proposals}
            loading={listQuery.isLoading}
            error={listQuery.error}
            errorTitle="Não foi possível carregar propostas."
            onRetry={() => void listQuery.refetch()}
            getRowId={(row) => row.id}
            onRowClick={(row) => setSelectedId(row.id)}
            pagination={{
              meta: {
                page,
                totalPages: listQuery.data?.meta.totalPages ?? 1,
                total: listQuery.data?.meta.total,
              },
              onPageChange: setPage,
            }}
            emptyTitle="Nenhum registro encontrado"
            emptyDescription="Clique em Novo para começar."
          />

          <div className="rounded-xl border border-border/70 bg-[var(--crm-surface-raised)] p-4">
            {selected ? (
              <ProposalDetailPanel
                proposal={selected}
                busy={isBusy}
                onGeneratePdf={() =>
                  generatePdf.mutate({
                    comparisonId: selected.comparisonId,
                    proposalId: selected.id,
                  })
                }
                onDownloadPdf={() => {
                  if (!selected.hasPdf) return
                  window.open(
                    getProposalPdfDownloadUrl(
                      selected.comparisonId,
                      selected.id,
                    ),
                    "_blank",
                  )
                }}
                onSend={() =>
                  markSent.mutate({
                    comparisonId: selected.comparisonId,
                    proposalId: selected.id,
                  })
                }
                onView={() =>
                  markViewed.mutate({
                    comparisonId: selected.comparisonId,
                    proposalId: selected.id,
                  })
                }
                onAccept={() =>
                  updateProposal.mutate({
                    comparisonId: selected.comparisonId,
                    proposalId: selected.id,
                    input: { status: "accepted" },
                  })
                }
                onReject={() =>
                  updateProposal.mutate({
                    comparisonId: selected.comparisonId,
                    proposalId: selected.id,
                    input: { status: "rejected" },
                  })
                }
                onExpire={() =>
                  markExpired.mutate({
                    comparisonId: selected.comparisonId,
                    proposalId: selected.id,
                  })
                }
                onOpenComparison={() =>
                  router.push(
                    `/cotacoes?comparisonId=${selected.comparisonId}&returnTo=${encodeURIComponent("/propostas")}`,
                  )
                }
              />
            ) : (
              <p className="crm-text-meta text-foreground/60">
                Selecione uma proposta para ver detalhes e ações.
              </p>
            )}
          </div>
        </div>
      </ContentContainer>
    </PageContainer>
  )
}

type ProposalDetailPanelProps = {
  proposal: ProposalListItem
  busy: boolean
  onGeneratePdf: () => void
  onDownloadPdf: () => void
  onSend: () => void
  onView: () => void
  onAccept: () => void
  onReject: () => void
  onExpire: () => void
  onOpenComparison: () => void
}

function ProposalDetailPanel({
  proposal,
  busy,
  onGeneratePdf,
  onDownloadPdf,
  onSend,
  onView,
  onAccept,
  onReject,
  onExpire,
  onOpenComparison,
}: ProposalDetailPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {proposal.title ?? "Proposta comercial"}
          </h3>
          <p className="crm-text-meta mt-1 text-foreground/65">
            {entityLabel(proposal)}
          </p>
        </div>
        <StatusPill
          tone={PROPOSAL_STATUS_TONE[proposal.status]}
          variant="soft"
          size="sm"
        >
          {proposalStatusLabel(proposal.status)}
        </StatusPill>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="crm-text-meta text-foreground/55">Valor</dt>
          <dd className="font-medium">
            {proposal.value != null
              ? proposal.value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="crm-text-meta text-foreground/55">Seguradora</dt>
          <dd>{proposal.quote?.insurer ?? "—"}</dd>
        </div>
        <div>
          <dt className="crm-text-meta text-foreground/55">PDF</dt>
          <dd>{proposal.hasPdf ? `v${proposal.pdfVersion}` : "Não gerado"}</dd>
        </div>
        <div>
          <dt className="crm-text-meta text-foreground/55">Validade</dt>
          <dd>{formatSubmissionDate(proposal.expiresAt)}</dd>
        </div>
      </dl>

      {proposal.signatureProvider ? (
        <p className="crm-text-meta rounded-md border border-dashed border-border/70 px-3 py-2 text-foreground/65">
          Assinatura eletrônica: {proposal.signatureStatus ?? "pendente"} (
          {proposal.signatureProvider})
        </p>
      ) : (
        <p className="crm-text-meta rounded-md border border-dashed border-border/70 px-3 py-2 text-foreground/55">
          Estrutura preparada para assinatura eletrônica (integração futura).
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          disabled={busy}
          onClick={onGeneratePdf}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileText className="size-3.5" />
          )}
          Gerar PDF profissional
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          disabled={!proposal.hasPdf}
          onClick={onDownloadPdf}
        >
          <FileDown className="size-3.5" />
          Baixar PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          disabled={busy || proposal.status !== "draft"}
          onClick={onSend}
        >
          <Send className="size-3.5" />
          Marcar como enviada
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          disabled={
            busy ||
            (proposal.status !== "sent" && proposal.status !== "viewed")
          }
          onClick={onView}
        >
          <Eye className="size-3.5" />
          Registrar visualização
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          disabled={busy || proposal.status === "accepted"}
          onClick={onAccept}
        >
          <CheckCircle2 className="size-3.5" />
          Aceitar proposta
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          disabled={busy || proposal.status === "rejected"}
          onClick={onReject}
        >
          Recusar proposta
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          disabled={
            busy ||
            proposal.status === "accepted" ||
            proposal.status === "rejected" ||
            proposal.status === "expired"
          }
          onClick={onExpire}
        >
          <TimerOff className="size-3.5" />
          Marcar como expirada
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={onOpenComparison}
        >
          Abrir comparativo de cotações
        </Button>
      </div>
    </div>
  )
}
