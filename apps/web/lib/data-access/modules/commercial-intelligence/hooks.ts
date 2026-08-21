"use client"

import { useMemo } from "react"

import { evaluateCommercialIntelligence } from "@/lib/crm/commercial-journey"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import { useLeadContext } from "@/lib/data-access/modules/leads"
import {
  useQuestionnaireFields,
  useQuestionnaireSubmission,
} from "@/lib/data-access/modules/questionnaires"
import {
  useDealProposals,
  useDealQuoteComparisons,
} from "@/lib/data-access/modules/quotes"
import { DEAL_WORKSPACE_QUOTES_LIMIT } from "@/lib/data-access/modules/quotes/constants"

type UseCommercialIntelligenceOptions = {
  enabled?: boolean
}

export function useCommercialIntelligence(
  deal: CrmDeal | null,
  options: UseCommercialIntelligenceOptions = {},
) {
  const enabled = Boolean(deal) && (options.enabled ?? true)
  const leadId = deal?.convertedLead?.id ?? null
  const dealId = deal?.id ?? null

  const leadContextQuery = useLeadContext(enabled ? leadId : null)

  const submissionId =
    deal?.commercialContext?.questionnaire.submissionId ??
    leadContextQuery.data?.latestSubmission?.id ??
    null

  const submissionQuery = useQuestionnaireSubmission(
    enabled ? submissionId : null,
  )
  const fieldsQuery = useQuestionnaireFields(
    submissionQuery.data?.templateId ?? null,
  )

  const comparisonsQuery = useDealQuoteComparisons(dealId, {
    limit: DEAL_WORKSPACE_QUOTES_LIMIT,
    enabled: enabled && Boolean(dealId),
  })

  const proposalsQuery = useDealProposals(dealId, {
    limit: 10,
    enabled: enabled && Boolean(dealId),
  })

  const snapshot = useMemo(() => {
    if (!deal) return null

    return evaluateCommercialIntelligence({
      deal,
      lead: leadContextQuery.data?.lead ?? null,
      questionnaireAnswers: submissionQuery.data?.answers ?? null,
      questionnaireFields: fieldsQuery.data ?? [],
      questionnaireStatus:
        deal.commercialContext?.questionnaire.status ??
        leadContextQuery.data?.latestSubmission?.status ??
        null,
      quoteComparisons: comparisonsQuery.data?.data ?? [],
      proposals: proposalsQuery.data?.data ?? [],
      hasPolicies: false,
      hasRenewals: false,
    })
  }, [
    comparisonsQuery.data?.data,
    deal,
    fieldsQuery.data,
    leadContextQuery.data?.latestSubmission?.status,
    leadContextQuery.data?.lead,
    proposalsQuery.data?.data,
    submissionQuery.data?.answers,
  ])

  const isLoading =
    (Boolean(leadId) && leadContextQuery.isLoading) ||
    (Boolean(submissionId) && submissionQuery.isLoading) ||
    comparisonsQuery.isLoading ||
    proposalsQuery.isLoading

  const isFetching =
    leadContextQuery.isFetching ||
    submissionQuery.isFetching ||
    comparisonsQuery.isFetching ||
    proposalsQuery.isFetching

  return {
    snapshot,
    isLoading,
    isFetching,
    error:
      leadContextQuery.error ??
      submissionQuery.error ??
      comparisonsQuery.error ??
      proposalsQuery.error,
  }
}
