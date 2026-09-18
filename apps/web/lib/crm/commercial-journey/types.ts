import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Lead } from "@/lib/data-access/modules/leads"
import type { QuestionnaireField } from "@/lib/data-access/modules/questionnaires"
import type { JsonObject } from "@/lib/data-access/modules/questionnaires"
import type { ProposalListItem, QuoteComparison } from "@/lib/data-access/modules/quotes"

export const COMMERCIAL_JOURNEY_STAGE_IDS = [
  "lead",
  "qualification",
  "questionnaire",
  "customer",
  "quotes",
  "comparison",
  "proposal",
  "policy",
  "post_sale",
  "renewal",
] as const

export type CommercialJourneyStageId =
  (typeof COMMERCIAL_JOURNEY_STAGE_IDS)[number]

export const COMMERCIAL_STAGE_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
] as const

export type CommercialStageStatus = (typeof COMMERCIAL_STAGE_STATUSES)[number]

export type CommercialJourneyStage = {
  id: CommercialJourneyStageId
  label: string
  status: CommercialStageStatus
  hint?: string
}

export type CommercialChecklistItemId =
  | "cpf"
  | "name"
  | "phone"
  | "email"
  | "cep"
  | "vehicle"
  | "main_driver"
  | "product"
  | "questionnaire_answered"
  | "customer_created"
  | "has_quote"
  | "quote_selected"
  | "proposal_issued"

export type CommercialChecklistItem = {
  id: CommercialChecklistItemId
  label: string
  completed: boolean
  required: boolean
  hint?: string
}

export type CommercialChecklist = {
  items: CommercialChecklistItem[]
  completedCount: number
  requiredCount: number
  requiredCompletedCount: number
  percentComplete: number
  pendingRequired: CommercialChecklistItem[]
}

export type CommercialScoreTier = "excellent" | "good" | "regular" | "low"

export type CommercialScoreCriterion = {
  id: string
  label: string
  weight: number
  earned: number
  met: boolean
}

export type CommercialScore = {
  value: number
  tier: CommercialScoreTier
  tierLabel: string
  criteria: CommercialScoreCriterion[]
}

export type CommercialRecommendationPriority = "high" | "medium" | "low"

export type CommercialRecommendation = {
  id: string
  message: string
  priority: CommercialRecommendationPriority
  relatedStageId?: CommercialJourneyStageId
  relatedChecklistId?: CommercialChecklistItemId
}

export type CommercialIntelligenceSnapshot = {
  journey: CommercialJourneyStage[]
  checklist: CommercialChecklist
  score: CommercialScore
  recommendations: CommercialRecommendation[]
  /** Eventos do Activity Engine correlacionados à jornada (somente leitura). */
  correlatedTimelineKinds: string[]
}

export type CommercialJourneyInput = {
  deal: CrmDeal
  lead?: Lead | null
  questionnaireAnswers?: JsonObject | null
  questionnaireFields?: QuestionnaireField[]
  questionnaireStatus?: string | null
  quoteComparisons?: QuoteComparison[]
  proposals?: ProposalListItem[]
  hasPolicies?: boolean
  hasRenewals?: boolean
}
