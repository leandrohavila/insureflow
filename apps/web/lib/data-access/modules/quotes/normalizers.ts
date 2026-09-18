import type {
  BackendProposal,
  BackendProposalListItem,
  BackendProposalListResponse,
  BackendQuoteComparison,
  BackendQuoteComparisonListResponse,
  BackendQuoteLine,
  BackendQuoteMetrics,
  Proposal,
  ProposalListItem,
  ProposalListResponse,
  QuoteComparison,
  QuoteComparisonListResponse,
  QuoteLine,
  QuoteMetrics,
} from "./types"

function normalizeText(value: string | null | undefined) {
  return value?.trim() || null
}

function normalizeNumber(value: number | string | null | undefined): number {
  if (value == null || value === "") return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeOptionalNumber(
  value: number | string | null | undefined,
): number | null {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

export function normalizeQuoteLine(line: BackendQuoteLine): QuoteLine {
  return {
    ...line,
    product: normalizeText(line.product),
    plan: normalizeText(line.plan),
    premiumValue: normalizeNumber(line.premiumValue),
    franchiseValue: normalizeOptionalNumber(line.franchiseValue),
    coverages: normalizeStringArray(line.coverages),
    assistance: normalizeText(line.assistance),
    effectiveFrom: line.effectiveFrom ?? null,
    effectiveTo: line.effectiveTo ?? null,
    status: line.status ?? "draft",
    observations: normalizeText(line.observations),
    externalSource: line.externalSource?.trim() || "manual",
    externalRef: normalizeText(line.externalRef),
    isSelected: line.isSelected ?? false,
    sortOrder: line.sortOrder ?? 0,
    createdAt: line.createdAt ?? "",
    updatedAt: line.updatedAt ?? "",
  }
}

export function normalizeProposal(proposal: BackendProposal): Proposal {
  return {
    ...proposal,
    quoteId: normalizeText(proposal.quoteId),
    status: proposal.status ?? "draft",
    title: normalizeText(proposal.title),
    value: normalizeOptionalNumber(proposal.value),
    sentAt: proposal.sentAt ?? null,
    viewedAt: proposal.viewedAt ?? null,
    respondedAt: proposal.respondedAt ?? null,
    expiresAt: proposal.expiresAt ?? null,
    expiredAt: proposal.expiredAt ?? null,
    notes: normalizeText(proposal.notes),
    pdfStorageKey: normalizeText(proposal.pdfStorageKey),
    pdfGeneratedAt: proposal.pdfGeneratedAt ?? null,
    pdfVersion: proposal.pdfVersion ?? 0,
    hasPdf: proposal.hasPdf ?? Boolean(proposal.pdfStorageKey),
    signatureProvider: normalizeText(proposal.signatureProvider),
    signatureExternalId: normalizeText(proposal.signatureExternalId),
    signatureStatus: normalizeText(proposal.signatureStatus),
    createdAt: proposal.createdAt ?? "",
    updatedAt: proposal.updatedAt ?? "",
  }
}

export function normalizeProposalListItem(
  proposal: BackendProposalListItem,
): ProposalListItem {
  const base = normalizeProposal(proposal)

  return {
    ...base,
    comparisonTitle: normalizeText(proposal.comparisonTitle),
    lead: proposal.lead?.id
      ? {
          id: proposal.lead.id,
          name: proposal.lead.name?.trim() || "Lead",
        }
      : null,
    deal: proposal.deal?.id
      ? {
          id: proposal.deal.id,
          title: proposal.deal.title?.trim() || "Negócio",
          company: proposal.deal.company?.trim() || "",
        }
      : null,
    customer: proposal.customer?.id
      ? {
          id: proposal.customer.id,
          name: proposal.customer.name?.trim() || "Cliente",
          document: normalizeText(proposal.customer.document),
        }
      : null,
    quote: proposal.quote?.id
      ? {
          id: proposal.quote.id,
          insurer: proposal.quote.insurer,
          plan: normalizeText(proposal.quote.plan),
          premiumValue: normalizeNumber(proposal.quote.premiumValue),
        }
      : null,
  }
}

export function normalizeProposalList(
  response: BackendProposalListResponse,
): ProposalListResponse {
  const data = response.data ?? []
  const meta = response.meta ?? {}

  return {
    data: data.map(normalizeProposalListItem),
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? data.length,
      total: meta.total ?? data.length,
      totalPages: meta.totalPages ?? 1,
    },
  }
}

export function normalizeQuoteComparison(
  comparison: BackendQuoteComparison,
): QuoteComparison {
  const quotes = (comparison.quotes ?? []).map(normalizeQuoteLine)

  return {
    ...comparison,
    title: normalizeText(comparison.title),
    workflowStatus: comparison.workflowStatus ?? "received",
    leadId: normalizeText(comparison.leadId),
    dealId: normalizeText(comparison.dealId),
    customerId: normalizeText(comparison.customerId),
    submissionId: normalizeText(comparison.submissionId),
    assignedToId: normalizeText(comparison.assignedToId),
    notes: normalizeText(comparison.notes),
    selectedQuoteId: normalizeText(comparison.selectedQuoteId),
    sentAt: comparison.sentAt ?? null,
    closedAt: comparison.closedAt ?? null,
    createdAt: comparison.createdAt ?? "",
    updatedAt: comparison.updatedAt ?? "",
    lead: comparison.lead?.id
      ? {
          id: comparison.lead.id,
          name: comparison.lead.name?.trim() || "Lead",
        }
      : null,
    deal: comparison.deal?.id
      ? {
          id: comparison.deal.id,
          title: comparison.deal.title?.trim() || "Negócio",
          company: comparison.deal.company?.trim() || "",
        }
      : null,
    customer: comparison.customer?.id
      ? {
          id: comparison.customer.id,
          name: comparison.customer.name?.trim() || "Cliente",
          document: normalizeText(comparison.customer.document),
        }
      : null,
    submission: comparison.submission?.id
      ? {
          id: comparison.submission.id,
          status: comparison.submission.status ?? "draft",
          templateId: comparison.submission.templateId,
          submittedAt: comparison.submission.submittedAt ?? null,
        }
      : null,
    assignedTo: comparison.assignedTo?.id
      ? {
          id: comparison.assignedTo.id,
          name: comparison.assignedTo.name?.trim() || "Responsável",
          initials: normalizeText(comparison.assignedTo.initials),
        }
      : null,
    quotes,
    proposals: (comparison.proposals ?? []).map(normalizeProposal),
    selectedQuote: comparison.selectedQuote
      ? normalizeQuoteLine(comparison.selectedQuote)
      : null,
  }
}

export function normalizeQuoteComparisonList(
  response: BackendQuoteComparisonListResponse,
): QuoteComparisonListResponse {
  const data = response.data ?? []
  const meta = response.meta ?? {}

  return {
    data: data.map(normalizeQuoteComparison),
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? data.length,
      total: meta.total ?? data.length,
      totalPages: meta.totalPages ?? 1,
    },
  }
}

export function normalizeQuoteMetrics(
  metrics: BackendQuoteMetrics,
): QuoteMetrics {
  const byWorkflowStatus = metrics.byWorkflowStatus ?? {}

  return {
    totalComparisons: metrics.totalComparisons ?? 0,
    recentComparisons: metrics.recentComparisons ?? 0,
    byWorkflowStatus,
    pendingAnalysis: metrics.pendingAnalysis ?? 0,
    sent: metrics.sent ?? 0,
    closedWon: metrics.closedWon ?? 0,
    closedLost: metrics.closedLost ?? 0,
    activeProposals: metrics.activeProposals ?? 0,
    acceptedProposals: metrics.acceptedProposals ?? 0,
    rejectedProposals: metrics.rejectedProposals ?? 0,
    sentProposals: metrics.sentProposals ?? 0,
    viewedProposals: metrics.viewedProposals ?? 0,
    expiredProposals: metrics.expiredProposals ?? 0,
    proposalsAwaitingResponse: metrics.proposalsAwaitingResponse ?? 0,
    averageQuoteDurationHours:
      metrics.averageQuoteDurationHours != null
        ? Number(metrics.averageQuoteDurationHours)
        : null,
    quoteConversionRate:
      metrics.quoteConversionRate != null
        ? Number(metrics.quoteConversionRate)
        : null,
  }
}
