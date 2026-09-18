import { apiClient } from "@/lib/data-access/api-client"

import {
  normalizeProposalList,
  normalizeProposalListItem,
  normalizeQuoteComparison,
  normalizeQuoteComparisonList,
  normalizeQuoteMetrics,
} from "./normalizers"
import type {
  BackendProposalListItem,
  BackendProposalListResponse,
  BackendQuoteComparison,
  BackendQuoteComparisonListResponse,
  BackendQuoteMetrics,
  BulkCreateQuoteLinesInput,
  CreateProposalInput,
  CreateQuoteComparisonInput,
  CreateQuoteLineInput,
  ProposalListFilters,
  QuoteComparisonListFilters,
  UpdateProposalInput,
  UpdateQuoteComparisonInput,
  UpdateQuoteLineInput,
} from "./types"

const QUOTES_PATH = "/api/quotes"
const COMPARISONS_PATH = "/api/quotes/comparisons"
const PROPOSALS_PATH = "/api/quotes/proposals"

function toProposalQueryString(filters: ProposalListFilters = {}) {
  const params = new URLSearchParams()

  if (filters.leadId) params.set("leadId", filters.leadId)
  if (filters.dealId) params.set("dealId", filters.dealId)
  if (filters.customerId) params.set("customerId", filters.customerId)
  if (filters.comparisonId) params.set("comparisonId", filters.comparisonId)
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status)
  }
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))

  const query = params.toString()
  return query ? `?${query}` : ""
}

function toComparisonQueryString(filters: QuoteComparisonListFilters = {}) {
  const params = new URLSearchParams()

  if (filters.leadId) params.set("leadId", filters.leadId)
  if (filters.dealId) params.set("dealId", filters.dealId)
  if (filters.customerId) params.set("customerId", filters.customerId)
  if (filters.submissionId) params.set("submissionId", filters.submissionId)
  if (filters.workflowStatus && filters.workflowStatus !== "all") {
    params.set("workflowStatus", filters.workflowStatus)
  }
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))

  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function fetchQuoteComparisons(
  filters: QuoteComparisonListFilters = {},
) {
  const response = await apiClient.get<BackendQuoteComparisonListResponse>(
    `${QUOTES_PATH}${toComparisonQueryString(filters)}`,
  )
  return normalizeQuoteComparisonList(response)
}

export async function fetchQuoteComparison(id: string) {
  const comparison = await apiClient.get<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${id}`,
  )
  return normalizeQuoteComparison(comparison)
}

export async function fetchQuoteMetrics() {
  const metrics = await apiClient.get<BackendQuoteMetrics>(
    `${QUOTES_PATH}/metrics`,
  )
  return normalizeQuoteMetrics(metrics)
}

export async function fetchProposals(filters: ProposalListFilters = {}) {
  const response = await apiClient.get<BackendProposalListResponse>(
    `${PROPOSALS_PATH}${toProposalQueryString(filters)}`,
  )
  return normalizeProposalList(response)
}

export async function fetchProposal(proposalId: string) {
  const item = await apiClient.get<BackendProposalListItem>(
    `${PROPOSALS_PATH}/${proposalId}`,
  )
  return normalizeProposalListItem(item)
}

export async function createQuoteComparison(input: CreateQuoteComparisonInput) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    COMPARISONS_PATH,
    input,
  )
  return normalizeQuoteComparison(comparison)
}

export async function updateQuoteComparison(
  id: string,
  input: UpdateQuoteComparisonInput,
) {
  const comparison = await apiClient.patch<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${id}`,
    input,
  )
  return normalizeQuoteComparison(comparison)
}

export async function addQuoteLine(
  comparisonId: string,
  input: CreateQuoteLineInput,
) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/quotes`,
    input,
  )
  return normalizeQuoteComparison(comparison)
}

export async function bulkAddQuoteLines(
  comparisonId: string,
  input: BulkCreateQuoteLinesInput,
) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/quotes/bulk`,
    input,
  )
  return normalizeQuoteComparison(comparison)
}

export async function updateQuoteLine(
  comparisonId: string,
  quoteId: string,
  input: UpdateQuoteLineInput,
) {
  const comparison = await apiClient.patch<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/quotes/${quoteId}`,
    input,
  )
  return normalizeQuoteComparison(comparison)
}

export async function selectQuoteLine(comparisonId: string, quoteId: string) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/quotes/${quoteId}/select`,
  )
  return normalizeQuoteComparison(comparison)
}

export async function markComparisonSent(comparisonId: string) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/send`,
  )
  return normalizeQuoteComparison(comparison)
}

export async function recordComparisonViewed(comparisonId: string) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/viewed`,
  )
  return normalizeQuoteComparison(comparison)
}

export async function createProposal(
  comparisonId: string,
  input: CreateProposalInput,
) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/proposals`,
    input,
  )
  return normalizeQuoteComparison(comparison)
}

export async function updateProposal(
  comparisonId: string,
  proposalId: string,
  input: UpdateProposalInput,
) {
  const comparison = await apiClient.patch<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/proposals/${proposalId}`,
    input,
  )
  return normalizeQuoteComparison(comparison)
}

export async function generateProposalPdf(
  comparisonId: string,
  proposalId: string,
) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/proposals/${proposalId}/generate-pdf`,
  )
  return normalizeQuoteComparison(comparison)
}

export function getProposalPdfDownloadUrl(
  comparisonId: string,
  proposalId: string,
) {
  return `${COMPARISONS_PATH}/${comparisonId}/proposals/${proposalId}/pdf`
}

export async function markProposalSent(comparisonId: string, proposalId: string) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/proposals/${proposalId}/send`,
  )
  return normalizeQuoteComparison(comparison)
}

export async function markProposalViewed(
  comparisonId: string,
  proposalId: string,
) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/proposals/${proposalId}/viewed`,
  )
  return normalizeQuoteComparison(comparison)
}

export async function markProposalExpired(
  comparisonId: string,
  proposalId: string,
) {
  const comparison = await apiClient.post<BackendQuoteComparison>(
    `${COMPARISONS_PATH}/${comparisonId}/proposals/${proposalId}/expire`,
  )
  return normalizeQuoteComparison(comparison)
}
