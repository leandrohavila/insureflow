"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import {
  addQuoteLine,
  bulkAddQuoteLines,
  createProposal,
  createQuoteComparison,
  fetchProposal,
  fetchProposals,
  fetchQuoteComparison,
  fetchQuoteComparisons,
  fetchQuoteMetrics,
  generateProposalPdf,
  markComparisonSent,
  markProposalExpired,
  markProposalSent,
  markProposalViewed,
  recordComparisonViewed,
  selectQuoteLine,
  updateProposal,
  updateQuoteComparison,
  updateQuoteLine,
} from "./api"
import type {
  BulkCreateQuoteLinesInput,
  CreateProposalInput,
  CreateQuoteLineInput,
  ProposalListFilters,
  QuoteComparison,
  QuoteComparisonListFilters,
  UpdateProposalInput,
  UpdateQuoteComparisonInput,
  UpdateQuoteLineInput,
} from "./types"

function invalidateQuoteSideEffects(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.activities.all })
}

export function useQuoteComparisons(
  filters: QuoteComparisonListFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.quotes.comparisons.list(filters),
    queryFn: () => fetchQuoteComparisons(filters),
    enabled: options?.enabled ?? true,
  })
}

export function useQuoteComparison(id: string | null) {
  return useQuery({
    queryKey: id
      ? queryKeys.quotes.comparisons.detail(id)
      : queryKeys.quotes.comparisons.details(),
    queryFn: () => fetchQuoteComparison(id as string),
    enabled: Boolean(id),
  })
}

export function useQuoteMetrics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.quotes.metrics(),
    queryFn: fetchQuoteMetrics,
    enabled: options?.enabled ?? true,
  })
}

export function useProposals(
  filters: ProposalListFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.quotes.proposals.list(filters),
    queryFn: () => fetchProposals(filters),
    enabled: options?.enabled ?? true,
  })
}

export function useProposal(proposalId: string | null) {
  return useQuery({
    queryKey: proposalId
      ? queryKeys.quotes.proposals.detail(proposalId)
      : queryKeys.quotes.proposals.lists(),
    queryFn: () => fetchProposal(proposalId as string),
    enabled: Boolean(proposalId),
  })
}

export function useLeadProposals(
  leadId: string | null,
  options?: { limit?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 10
  const filters: ProposalListFilters = leadId
    ? { leadId, page: 1, limit }
    : { page: 1, limit: 0 }

  return useQuery({
    queryKey: leadId
      ? queryKeys.quotes.proposals.byLead(leadId, { limit })
      : queryKeys.quotes.proposals.lists(),
    queryFn: () => fetchProposals(filters),
    enabled: Boolean(leadId) && (options?.enabled ?? true),
  })
}

export function useDealProposals(
  dealId: string | null,
  options?: { limit?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 10
  const filters: ProposalListFilters = dealId
    ? { dealId, page: 1, limit }
    : { page: 1, limit: 0 }

  return useQuery({
    queryKey: dealId
      ? queryKeys.quotes.proposals.byDeal(dealId, { limit })
      : queryKeys.quotes.proposals.lists(),
    queryFn: () => fetchProposals(filters),
    enabled: Boolean(dealId) && (options?.enabled ?? true),
  })
}

export function useCustomerProposals(
  customerId: string | null,
  options?: { limit?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 10
  const filters: ProposalListFilters = customerId
    ? { customerId, page: 1, limit }
    : { page: 1, limit: 0 }

  return useQuery({
    queryKey: customerId
      ? queryKeys.quotes.proposals.byCustomer(customerId, { limit })
      : queryKeys.quotes.proposals.lists(),
    queryFn: () => fetchProposals(filters),
    enabled: Boolean(customerId) && (options?.enabled ?? true),
  })
}

export function useDealQuoteComparisons(
  dealId: string | null,
  options?: { limit?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 5
  const filters: QuoteComparisonListFilters = dealId
    ? { dealId, page: 1, limit }
    : { page: 1, limit: 0 }

  return useQuery({
    queryKey: dealId
      ? queryKeys.quotes.comparisons.byDeal(dealId, { limit })
      : queryKeys.quotes.comparisons.details(),
    queryFn: () => fetchQuoteComparisons(filters),
    enabled: Boolean(dealId) && (options?.enabled ?? true),
  })
}

export function useLeadQuoteComparisons(
  leadId: string | null,
  options?: { limit?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 5
  const filters: QuoteComparisonListFilters = leadId
    ? { leadId, page: 1, limit }
    : { page: 1, limit: 0 }

  return useQuery({
    queryKey: leadId
      ? queryKeys.quotes.comparisons.byLead(leadId, { limit })
      : queryKeys.quotes.comparisons.details(),
    queryFn: () => fetchQuoteComparisons(filters),
    enabled: Boolean(leadId) && (options?.enabled ?? true),
  })
}

export function useCustomerQuoteComparisons(
  customerId: string | null,
  options?: { limit?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 5
  const filters: QuoteComparisonListFilters = customerId
    ? { customerId, page: 1, limit }
    : { page: 1, limit: 0 }

  return useQuery({
    queryKey: customerId
      ? queryKeys.quotes.comparisons.byCustomer(customerId, { limit })
      : queryKeys.quotes.comparisons.details(),
    queryFn: () => fetchQuoteComparisons(filters),
    enabled: Boolean(customerId) && (options?.enabled ?? true),
  })
}

export function useCreateQuoteComparison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createQuoteComparison,
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateQuoteSideEffects(queryClient)
    },
  })
}

export function useUpdateQuoteComparison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateQuoteComparisonInput
    }) => updateQuoteComparison(id, input),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateQuoteSideEffects(queryClient)
    },
  })
}

export function useAddQuoteLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      comparisonId,
      input,
    }: {
      comparisonId: string
      input: CreateQuoteLineInput
    }) => addQuoteLine(comparisonId, input),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateQuoteSideEffects(queryClient)
    },
  })
}

export function useBulkAddQuoteLines() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      comparisonId,
      input,
    }: {
      comparisonId: string
      input: BulkCreateQuoteLinesInput
    }) => bulkAddQuoteLines(comparisonId, input),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateQuoteSideEffects(queryClient)
    },
  })
}

export function useUpdateQuoteLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      comparisonId,
      quoteId,
      input,
    }: {
      comparisonId: string
      quoteId: string
      input: UpdateQuoteLineInput
    }) => updateQuoteLine(comparisonId, quoteId, input),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateQuoteSideEffects(queryClient)
    },
  })
}

export function useSelectQuoteLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      comparisonId,
      quoteId,
    }: {
      comparisonId: string
      quoteId: string
    }) => selectQuoteLine(comparisonId, quoteId),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateQuoteSideEffects(queryClient)
    },
  })
}

export function useMarkComparisonSent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markComparisonSent,
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateQuoteSideEffects(queryClient)
    },
  })
}

export function useRecordComparisonViewed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recordComparisonViewed,
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
    },
  })
}

export function useCreateProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      comparisonId,
      input,
    }: {
      comparisonId: string
      input: CreateProposalInput
    }) => createProposal(comparisonId, input),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateQuoteSideEffects(queryClient)
    },
  })
}

export function useUpdateProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      comparisonId,
      proposalId,
      input,
    }: {
      comparisonId: string
      proposalId: string
      input: UpdateProposalInput
    }) => updateProposal(comparisonId, proposalId, input),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateProposalQueries(queryClient)
    },
  })
}

function invalidateProposalQueries(queryClient: ReturnType<typeof useQueryClient>) {
  invalidateQuoteSideEffects(queryClient)
}

export function useGenerateProposalPdf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      comparisonId,
      proposalId,
    }: {
      comparisonId: string
      proposalId: string
    }) => generateProposalPdf(comparisonId, proposalId),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateProposalQueries(queryClient)
    },
  })
}

export function useMarkProposalSent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      comparisonId,
      proposalId,
    }: {
      comparisonId: string
      proposalId: string
    }) => markProposalSent(comparisonId, proposalId),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateProposalQueries(queryClient)
    },
  })
}

export function useMarkProposalViewed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      comparisonId,
      proposalId,
    }: {
      comparisonId: string
      proposalId: string
    }) => markProposalViewed(comparisonId, proposalId),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateProposalQueries(queryClient)
    },
  })
}

export function useMarkProposalExpired() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      comparisonId,
      proposalId,
    }: {
      comparisonId: string
      proposalId: string
    }) => markProposalExpired(comparisonId, proposalId),
    onSuccess: (comparison) => {
      queryClient.setQueryData<QuoteComparison>(
        queryKeys.quotes.comparisons.detail(comparison.id),
        comparison,
      )
      invalidateProposalQueries(queryClient)
    },
  })
}
