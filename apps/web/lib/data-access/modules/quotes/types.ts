export const QUOTE_WORKFLOW_STATUSES = [
  "received",
  "in_analysis",
  "quote_created",
  "quote_sent",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const

export const QUOTE_LINE_STATUSES = [
  "draft",
  "quoted",
  "sent",
  "selected",
  "rejected",
  "expired",
] as const

export const PROPOSAL_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
] as const

export type QuoteWorkflowStatus = (typeof QUOTE_WORKFLOW_STATUSES)[number]
export type QuoteLineStatus = (typeof QUOTE_LINE_STATUSES)[number]
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]

export type QuoteComparisonLeadSummary = {
  id: string
  name: string
}

export type QuoteComparisonDealSummary = {
  id: string
  title: string
  company: string
}

export type QuoteComparisonCustomerSummary = {
  id: string
  name: string
  document: string | null
}

export type QuoteComparisonSubmissionSummary = {
  id: string
  status: string
  templateId: string
  submittedAt: string | null
}

export type QuoteComparisonAssigneeSummary = {
  id: string
  name: string
  initials: string | null
}

export type QuoteLine = {
  id: string
  tenantId: string
  comparisonId: string
  insurer: string
  product: string | null
  plan: string | null
  premiumValue: number
  franchiseValue: number | null
  coverages: string[]
  assistance: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  status: QuoteLineStatus
  observations: string | null
  externalSource: string
  externalRef: string | null
  isSelected: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type Proposal = {
  id: string
  tenantId: string
  comparisonId: string
  quoteId: string | null
  status: ProposalStatus
  title: string | null
  value: number | null
  sentAt: string | null
  viewedAt: string | null
  respondedAt: string | null
  expiresAt: string | null
  expiredAt: string | null
  notes: string | null
  pdfStorageKey: string | null
  pdfGeneratedAt: string | null
  pdfVersion: number
  hasPdf: boolean
  signatureProvider: string | null
  signatureExternalId: string | null
  signatureStatus: string | null
  createdAt: string
  updatedAt: string
}

export type ProposalListItem = Proposal & {
  comparisonTitle: string | null
  lead: QuoteComparisonLeadSummary | null
  deal: QuoteComparisonDealSummary | null
  customer: QuoteComparisonCustomerSummary | null
  quote: {
    id: string
    insurer: string
    plan: string | null
    premiumValue: number
  } | null
}

export type QuoteComparison = {
  id: string
  tenantId: string
  title: string | null
  workflowStatus: QuoteWorkflowStatus
  leadId: string | null
  dealId: string | null
  customerId: string | null
  submissionId: string | null
  assignedToId: string | null
  notes: string | null
  selectedQuoteId: string | null
  sentAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  lead: QuoteComparisonLeadSummary | null
  deal: QuoteComparisonDealSummary | null
  customer: QuoteComparisonCustomerSummary | null
  submission: QuoteComparisonSubmissionSummary | null
  assignedTo: QuoteComparisonAssigneeSummary | null
  quotes: QuoteLine[]
  proposals: Proposal[]
  selectedQuote: QuoteLine | null
}

export type QuoteComparisonSummary = {
  comparisonId: string
  workflowStatus: QuoteWorkflowStatus
  title: string | null
  lineCount: number
  hasSelectedQuote: boolean
  updatedAt: string
}

export type QuoteListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type QuoteComparisonListFilters = {
  leadId?: string
  dealId?: string
  customerId?: string
  submissionId?: string
  workflowStatus?: QuoteWorkflowStatus | "all"
  page?: number
  limit?: number
}

export type QuoteComparisonListResponse = {
  data: QuoteComparison[]
  meta: QuoteListMeta
}

export type QuoteMetrics = {
  totalComparisons: number
  recentComparisons: number
  byWorkflowStatus: Partial<Record<QuoteWorkflowStatus, number>>
  pendingAnalysis: number
  sent: number
  closedWon: number
  closedLost: number
  activeProposals: number
  acceptedProposals: number
  rejectedProposals: number
  sentProposals: number
  viewedProposals: number
  expiredProposals: number
  proposalsAwaitingResponse: number
  averageQuoteDurationHours: number | null
  quoteConversionRate: number | null
}

export type ProposalListFilters = {
  leadId?: string
  dealId?: string
  customerId?: string
  comparisonId?: string
  status?: ProposalStatus | "all"
  page?: number
  limit?: number
}

export type ProposalListResponse = {
  data: ProposalListItem[]
  meta: QuoteListMeta
}

export type CreateQuoteComparisonInput = {
  title?: string
  leadId?: string
  dealId?: string
  customerId?: string
  submissionId?: string
  assignedToId?: string
  notes?: string
}

export type UpdateQuoteComparisonInput = {
  title?: string
  workflowStatus?: QuoteWorkflowStatus
  notes?: string
  assignedToId?: string
}

export type CreateQuoteLineInput = {
  insurer: string
  product?: string
  plan?: string
  premiumValue: number
  franchiseValue?: number
  coverages?: string[]
  assistance?: string
  effectiveFrom?: string
  effectiveTo?: string
  status?: QuoteLineStatus
  observations?: string
  externalSource?: string
  sortOrder?: number
}

export type UpdateQuoteLineInput = Partial<CreateQuoteLineInput> & {
  isSelected?: boolean
}

export type BulkCreateQuoteLinesInput = {
  lines: CreateQuoteLineInput[]
}

export type CreateProposalInput = {
  quoteId?: string
  title?: string
  value?: number
  notes?: string
  expiresAt?: string
}

export type UpdateProposalInput = {
  status?: ProposalStatus
  title?: string
  value?: number
  notes?: string
  expiresAt?: string
}

export type BackendQuoteLine = Omit<
  QuoteLine,
  "premiumValue" | "franchiseValue" | "coverages" | "isSelected" | "sortOrder"
> & {
  premiumValue?: number | string | null
  franchiseValue?: number | string | null
  coverages?: unknown
  isSelected?: boolean | null
  sortOrder?: number | null
}

export type BackendProposal = Omit<
  Proposal,
  "value" | "hasPdf" | "pdfVersion"
> & {
  value?: number | string | null
  pdfVersion?: number | null
  hasPdf?: boolean | null
}

export type BackendProposalListItem = BackendProposal & {
  comparisonTitle?: string | null
  lead?: QuoteComparisonLeadSummary | null
  deal?: QuoteComparisonDealSummary | null
  customer?: QuoteComparisonCustomerSummary | null
  quote?: {
    id: string
    insurer: string
    plan?: string | null
    premiumValue?: number | string
  } | null
}

export type BackendProposalListResponse = {
  data?: BackendProposalListItem[] | null
  meta?: Partial<QuoteListMeta> | null
}

export type BackendQuoteComparison = Omit<
  QuoteComparison,
  "quotes" | "proposals" | "selectedQuote"
> & {
  quotes?: BackendQuoteLine[] | null
  proposals?: BackendProposal[] | null
  selectedQuote?: BackendQuoteLine | null
}

export type BackendQuoteComparisonListResponse = {
  data?: BackendQuoteComparison[] | null
  meta?: Partial<QuoteListMeta> | null
}

export type BackendQuoteMetrics = Partial<QuoteMetrics> & {
  byWorkflowStatus?: Partial<Record<QuoteWorkflowStatus, number>> | null
}
