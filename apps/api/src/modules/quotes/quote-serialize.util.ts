import { Prisma } from '@prisma/client';

export const quoteComparisonInclude = {
  lead: { select: { id: true, name: true } },
  deal: { select: { id: true, title: true, company: true } },
  customer: { select: { id: true, name: true, document: true } },
  submission: {
    select: { id: true, status: true, templateId: true, submittedAt: true },
  },
  assignedTo: { select: { id: true, name: true, initials: true } },
  quotes: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  proposals: { orderBy: [{ createdAt: 'desc' }] },
  selectedQuote: true,
} satisfies Prisma.QuoteComparisonInclude;

export type QuoteComparisonRecord = Prisma.QuoteComparisonGetPayload<{
  include: typeof quoteComparisonInclude;
}>;

export const proposalListInclude = {
  quote: true,
  comparison: {
    include: {
      lead: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true, company: true } },
      customer: { select: { id: true, name: true, document: true } },
    },
  },
} satisfies Prisma.ProposalInclude;

export type QuoteRecord = QuoteComparisonRecord['quotes'][number];
export type ProposalRecord = QuoteComparisonRecord['proposals'][number];
export type ProposalListRecord = Prisma.ProposalGetPayload<{
  include: typeof proposalListInclude;
}>;

function toNumber(value: Prisma.Decimal | null | undefined): number | null {
  return value != null ? Number(value) : null;
}

function toIso(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}

function toStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function serializeQuoteLine(quote: QuoteRecord) {
  return {
    ...quote,
    premiumValue: Number(quote.premiumValue),
    franchiseValue: toNumber(quote.franchiseValue),
    coverages: toStringArray(quote.coverages),
    effectiveFrom: toIso(quote.effectiveFrom),
    effectiveTo: toIso(quote.effectiveTo),
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
  };
}

export function serializeProposal(
  proposal: ProposalRecord | ProposalListRecord,
) {
  return {
    ...proposal,
    value: toNumber(proposal.value),
    sentAt: toIso(proposal.sentAt),
    viewedAt: toIso(proposal.viewedAt),
    respondedAt: toIso(proposal.respondedAt),
    expiresAt: toIso(proposal.expiresAt),
    expiredAt: toIso(proposal.expiredAt),
    pdfGeneratedAt: toIso(proposal.pdfGeneratedAt),
    pdfStorageKey: proposal.pdfStorageKey ?? null,
    pdfVersion: proposal.pdfVersion ?? 0,
    signatureProvider: proposal.signatureProvider ?? null,
    signatureExternalId: proposal.signatureExternalId ?? null,
    signatureStatus: proposal.signatureStatus ?? null,
    hasPdf: Boolean(proposal.pdfStorageKey),
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  };
}

export function serializeProposalListItem(proposal: ProposalListRecord) {
  const base = serializeProposal(proposal);
  const comparison = proposal.comparison;

  return {
    ...base,
    comparisonId: comparison.id,
    comparisonTitle: comparison.title,
    lead: comparison.lead,
    deal: comparison.deal,
    customer: comparison.customer,
    quote: proposal.quote
      ? {
          id: proposal.quote.id,
          insurer: proposal.quote.insurer,
          plan: proposal.quote.plan,
          premiumValue: Number(proposal.quote.premiumValue),
        }
      : null,
  };
}

export function serializeQuoteComparison(comparison: QuoteComparisonRecord) {
  return {
    ...comparison,
    sentAt: toIso(comparison.sentAt),
    closedAt: toIso(comparison.closedAt),
    createdAt: comparison.createdAt.toISOString(),
    updatedAt: comparison.updatedAt.toISOString(),
    quotes: comparison.quotes.map(serializeQuoteLine),
    proposals: comparison.proposals.map(serializeProposal),
    selectedQuote: comparison.selectedQuote
      ? serializeQuoteLine(comparison.selectedQuote)
      : null,
  };
}

export function serializeQuoteComparisonSummary(comparison: {
  id: string;
  workflowStatus: QuoteComparisonRecord['workflowStatus'];
  title: string | null;
  selectedQuoteId: string | null;
  updatedAt: Date;
  quotes: Array<{ id: string }>;
}) {
  return {
    comparisonId: comparison.id,
    workflowStatus: comparison.workflowStatus,
    title: comparison.title,
    lineCount: comparison.quotes.length,
    hasSelectedQuote: Boolean(comparison.selectedQuoteId),
    updatedAt: comparison.updatedAt.toISOString(),
  };
}
