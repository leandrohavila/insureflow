"use client"

import Link from "next/link"
import { ArrowUpRight, FileText, Loader2 } from "lucide-react"

import { SectionPanel, StatusPill } from "@/components/crm/primitives"
import {
  PROPOSAL_STATUS_TONE,
  proposalStatusLabel,
} from "@/components/quotes/quote-status-labels"
import { buttonVariants } from "@/components/ui/button"
import { formatSubmissionDate } from "@/components/questionnaires/questionnaire-answer-utils"
import {
  useCustomerProposals,
  useDealProposals,
  useLeadProposals,
  type ProposalListItem,
} from "@/lib/data-access/modules/quotes"
import { cn } from "@/lib/utils"

type EntityProposalsSectionProps = {
  returnTo: string
  leadId?: string | null
  dealId?: string | null
  customerId?: string | null
}

function buildProposalsHref(input: EntityProposalsSectionProps) {
  const params = new URLSearchParams()
  if (input.leadId) params.set("leadId", input.leadId)
  if (input.dealId) params.set("dealId", input.dealId)
  if (input.customerId) params.set("customerId", input.customerId)
  params.set("returnTo", input.returnTo)
  return `/propostas?${params.toString()}`
}

function ProposalHistoryRow({ proposal }: { proposal: ProposalListItem }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-[var(--crm-surface-panel)] px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {proposal.title ?? "Proposta comercial"}
        </p>
        <p className="crm-text-meta text-foreground/60">
          {proposal.quote?.insurer ?? "Sem seguradora"} ·{" "}
          {formatSubmissionDate(proposal.updatedAt)}
        </p>
      </div>
      <StatusPill
        tone={PROPOSAL_STATUS_TONE[proposal.status]}
        variant="soft"
        size="xs"
      >
        {proposalStatusLabel(proposal.status)}
      </StatusPill>
    </div>
  )
}

export function EntityProposalsSection({
  returnTo,
  leadId = null,
  dealId = null,
  customerId = null,
}: EntityProposalsSectionProps) {
  const leadQuery = useLeadProposals(leadId, {
    limit: 8,
    enabled: Boolean(leadId) && !dealId,
  })
  const dealQuery = useDealProposals(dealId, {
    limit: 8,
    enabled: Boolean(dealId),
  })
  const customerQuery = useCustomerProposals(customerId, {
    limit: 8,
    enabled: Boolean(customerId) && !dealId && !leadId,
  })

  const listQuery = dealId ? dealQuery : leadId ? leadQuery : customerQuery
  const proposals = listQuery.data?.data ?? []
  const proposalsHref = buildProposalsHref({ returnTo, leadId, dealId, customerId })

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel title="Histórico de propostas" tone="default" density="compact">
        {listQuery.isLoading ? (
          <p className="crm-text-meta flex items-center gap-1.5 px-3 py-4 text-foreground/55">
            <Loader2 className="size-3.5 animate-spin" />
            Carregando propostas…
          </p>
        ) : proposals.length > 0 ? (
          <div className="flex flex-col gap-2 px-3 py-2">
            {proposals.map((proposal) => (
              <ProposalHistoryRow key={proposal.id} proposal={proposal} />
            ))}
          </div>
        ) : (
          <p className="crm-text-meta px-3 py-4 text-foreground/65">
            Nenhuma proposta registrada para esta entidade.
          </p>
        )}
      </SectionPanel>

      <SectionPanel title="Centro de propostas" tone="default" density="compact">
        <div className="flex flex-col gap-2 px-1.5 pb-1 pt-1">
          <Link
            href={proposalsHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full justify-start gap-2",
            )}
          >
            <FileText className="size-3.5" />
            Abrir centro de propostas
            <ArrowUpRight className="ml-auto size-3.5 opacity-60" />
          </Link>
          {proposals.length > 0 ? (
            <Link
              href={proposalsHref}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "justify-start",
              )}
            >
              Ver histórico completo ({listQuery.data?.meta.total ?? proposals.length})
            </Link>
          ) : null}
        </div>
      </SectionPanel>
    </div>
  )
}
