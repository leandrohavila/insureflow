import { isValidPhone } from "@/lib/questionnaires/questionnaire-field-validation"
import { isValidCpfDigits, normalizeCpf, stripDocumentDigits } from "@/lib/documents/document"

import {
  findAnswerByPatterns,
  isAutoProduct,
  isValidCep,
  resolveQuestionnaireBonus,
  resolveQuestionnaireCpf,
  resolveSecondDriver,
} from "./field-resolvers"
import type {
  CommercialChecklist,
  CommercialChecklistItem,
  CommercialIntelligenceSnapshot,
  CommercialJourneyInput,
  CommercialJourneyStage,
  CommercialJourneyStageId,
  CommercialRecommendation,
  CommercialScore,
  CommercialScoreTier,
  CommercialStageStatus,
} from "./types"

const JOURNEY_LABELS: Record<CommercialJourneyStageId, string> = {
  lead: "Lead",
  qualification: "Qualificação",
  questionnaire: "Questionário",
  customer: "Cliente",
  quotes: "Cotações",
  comparison: "Comparativo",
  proposal: "Proposta",
  policy: "Apólice",
  post_sale: "Pós-venda",
  renewal: "Renovação",
}

const SCORE_TIER_LABELS: Record<CommercialScoreTier, string> = {
  excellent: "Excelente",
  good: "Bom",
  regular: "Regular",
  low: "Baixo",
}

function resolveTier(value: number): CommercialScoreTier {
  if (value >= 85) return "excellent"
  if (value >= 70) return "good"
  if (value >= 50) return "regular"
  return "low"
}

function hasLead(input: CommercialJourneyInput) {
  return Boolean(input.lead || input.deal.convertedLead)
}

function isQuestionnaireComplete(input: CommercialJourneyInput) {
  const status =
    input.questionnaireStatus ??
    input.deal.commercialContext?.questionnaire.status ??
    "pending"
  return status === "submitted" || status === "reviewed"
}

function isQuestionnaireStarted(input: CommercialJourneyInput) {
  const status =
    input.questionnaireStatus ??
    input.deal.commercialContext?.questionnaire.status ??
    "pending"
  return status !== "pending"
}

function hasCustomer(input: CommercialJourneyInput) {
  return Boolean(input.deal.customerId) || input.deal.status === "won"
}

function quoteSummary(input: CommercialJourneyInput) {
  const comparisons = input.quoteComparisons ?? []
  const primary =
    comparisons[0] ??
    (input.deal.commercialContext?.quote
      ? {
          id: input.deal.commercialContext.quote.comparisonId,
          quotes: Array.from({
            length: input.deal.commercialContext.quote.lineCount,
          }),
          selectedQuoteId: input.deal.commercialContext.quote.hasSelectedQuote
            ? "selected"
            : null,
          workflowStatus: input.deal.commercialContext.quote.workflowStatus,
        }
      : null)

  const lineCount =
    comparisons.reduce((max, item) => Math.max(max, item.quotes.length), 0) ||
    primary?.quotes.length ||
    input.deal.commercialContext?.quote?.lineCount ||
    0

  const hasSelected =
    comparisons.some((item) => Boolean(item.selectedQuoteId)) ||
    input.deal.commercialContext?.quote?.hasSelectedQuote === true

  const hasComparison = comparisons.length > 0 || Boolean(primary)
  const quoteSent =
    comparisons.some((item) => item.workflowStatus === "quote_sent") ||
    input.deal.commercialContext?.quote?.workflowStatus === "quote_sent"

  return {
    hasComparison,
    lineCount,
    hasSelected,
    quoteSent,
  }
}

function hasProposal(input: CommercialJourneyInput) {
  return (input.proposals?.length ?? 0) > 0
}

function buildChecklist(input: CommercialJourneyInput): CommercialChecklist {
  const lead = input.lead ?? null
  const answers = input.questionnaireAnswers ?? null
  const fields = input.questionnaireFields ?? []
  const quotes = quoteSummary(input)

  const cpfFromLead =
    lead?.documentType === "cpf" && lead.document
      ? normalizeCpf(lead.document)
      : null
  const cpfFromAnswers = resolveQuestionnaireCpf(answers, fields)
  const cpf = cpfFromLead ?? cpfFromAnswers

  const name = lead?.name?.trim() || input.deal.contact?.trim() || input.deal.title
  const phone = lead?.phone ?? input.deal.commercialContext?.phone ?? null
  const email = lead?.email ?? input.deal.email ?? null
  const cep = findAnswerByPatterns(answers, fields, ["cep", "codigo_postal"])
  const vehicle = findAnswerByPatterns(answers, fields, [
    "veiculo",
    "vehicle",
    "placa",
    "modelo",
    "marca",
  ])
  const mainDriver = findAnswerByPatterns(answers, fields, [
    "condutor",
    "condutor_principal",
    "main_driver",
    "segurado",
  ])
  const product = input.deal.product?.trim()

  const items: CommercialChecklistItem[] = [
    {
      id: "cpf",
      label: "CPF",
      completed: Boolean(cpf),
      required: true,
    },
    {
      id: "name",
      label: "Nome",
      completed: Boolean(name),
      required: true,
    },
    {
      id: "phone",
      label: "Telefone",
      completed: Boolean(phone && isValidPhone(String(phone))),
      required: true,
    },
    {
      id: "email",
      label: "Email",
      completed: Boolean(email?.trim()),
      required: false,
    },
    {
      id: "cep",
      label: "CEP",
      completed: isValidCep(cep),
      required: true,
    },
    {
      id: "vehicle",
      label: "Veículo",
      completed: Boolean(vehicle),
      required: isAutoProduct(product),
    },
    {
      id: "main_driver",
      label: "Condutor Principal",
      completed: Boolean(mainDriver) || Boolean(cpf && name),
      required: isAutoProduct(product),
    },
    {
      id: "product",
      label: "Produto",
      completed: Boolean(product),
      required: true,
    },
    {
      id: "questionnaire_answered",
      label: "Questionário Respondido",
      completed: isQuestionnaireComplete(input),
      required: true,
    },
    {
      id: "customer_created",
      label: "Cliente Criado",
      completed: hasCustomer(input),
      required: false,
    },
    {
      id: "has_quote",
      label: "Possui Cotação",
      completed: quotes.hasComparison && quotes.lineCount > 0,
      required: false,
    },
    {
      id: "quote_selected",
      label: "Cotação Selecionada",
      completed: quotes.hasSelected,
      required: false,
    },
    {
      id: "proposal_issued",
      label: "Proposta Emitida",
      completed: hasProposal(input),
      required: false,
    },
  ]

  const completedCount = items.filter((item) => item.completed).length
  const requiredItems = items.filter((item) => item.required)
  const requiredCompletedCount = requiredItems.filter((item) => item.completed)
    .length

  return {
    items,
    completedCount,
    requiredCount: requiredItems.length,
    requiredCompletedCount,
    percentComplete: Math.round((completedCount / items.length) * 100),
    pendingRequired: requiredItems.filter((item) => !item.completed),
  }
}

function stageStatus(
  completed: boolean,
  inProgress: boolean,
  blocked: boolean,
): CommercialStageStatus {
  if (blocked) return "BLOCKED"
  if (completed) return "COMPLETED"
  if (inProgress) return "IN_PROGRESS"
  return "NOT_STARTED"
}

function buildJourney(input: CommercialJourneyInput): CommercialJourneyStage[] {
  const leadOk = hasLead(input)
  const qualified =
    input.lead?.status === "qualified" ||
    input.lead?.status === "converted" ||
    input.deal.stage !== "novo"
  const questionnaireDone = isQuestionnaireComplete(input)
  const questionnaireStarted = isQuestionnaireStarted(input)
  const customerOk = hasCustomer(input)
  const quotes = quoteSummary(input)
  const proposalOk = hasProposal(input)
  const policyOk = input.hasPolicies === true
  const postSaleOk = policyOk && input.deal.status === "won"
  const renewalOk = input.hasRenewals === true

  const stages: CommercialJourneyStage[] = [
    {
      id: "lead",
      label: JOURNEY_LABELS.lead,
      status: stageStatus(leadOk, false, false),
    },
    {
      id: "qualification",
      label: JOURNEY_LABELS.qualification,
      status: stageStatus(
        qualified,
        leadOk && !qualified,
        !leadOk,
      ),
    },
    {
      id: "questionnaire",
      label: JOURNEY_LABELS.questionnaire,
      status: stageStatus(
        questionnaireDone,
        questionnaireStarted && !questionnaireDone,
        !qualified,
      ),
    },
    {
      id: "customer",
      label: JOURNEY_LABELS.customer,
      status: stageStatus(
        customerOk,
        proposalOk && !customerOk,
        !questionnaireDone,
      ),
    },
    {
      id: "quotes",
      label: JOURNEY_LABELS.quotes,
      status: stageStatus(
        quotes.hasComparison && quotes.lineCount > 0,
        questionnaireDone && !quotes.hasComparison,
        !questionnaireDone,
      ),
    },
    {
      id: "comparison",
      label: JOURNEY_LABELS.comparison,
      status: stageStatus(
        quotes.lineCount >= 2,
        quotes.lineCount === 1,
        !quotes.hasComparison,
      ),
    },
    {
      id: "proposal",
      label: JOURNEY_LABELS.proposal,
      status: stageStatus(
        proposalOk,
        quotes.hasSelected && !proposalOk,
        !quotes.hasSelected,
      ),
    },
    {
      id: "policy",
      label: JOURNEY_LABELS.policy,
      status: stageStatus(
        policyOk,
        proposalOk && !policyOk,
        !proposalOk,
      ),
      hint: policyOk ? undefined : "Integração de apólices pendente",
    },
    {
      id: "post_sale",
      label: JOURNEY_LABELS.post_sale,
      status: stageStatus(postSaleOk, policyOk && !postSaleOk, !policyOk),
    },
    {
      id: "renewal",
      label: JOURNEY_LABELS.renewal,
      status: stageStatus(renewalOk, postSaleOk && !renewalOk, !postSaleOk),
      hint: renewalOk ? undefined : "Renovações disponíveis após apólice ativa",
    },
  ]

  return stages
}

function buildScore(
  input: CommercialJourneyInput,
  checklist: CommercialChecklist,
): CommercialScore {
  const lead = input.lead ?? null
  const answers = input.questionnaireAnswers ?? null
  const fields = input.questionnaireFields ?? []
  const quotes = quoteSummary(input)

  const cpfFromLead =
    lead?.documentType === "cpf" && lead.document
      ? normalizeCpf(lead.document)
      : null
  const cpf =
    cpfFromLead ?? resolveQuestionnaireCpf(answers, fields)

  const phone = lead?.phone ?? input.deal.commercialContext?.phone ?? null
  const email = lead?.email ?? input.deal.email ?? null

  const criteria = [
    {
      id: "registration",
      label: "Cadastro completo",
      weight: 8,
      met: checklist.items.find((item) => item.id === "name")?.completed === true &&
        checklist.items.find((item) => item.id === "cpf")?.completed === true,
    },
    {
      id: "phone",
      label: "Telefone válido",
      weight: 8,
      met: Boolean(phone && isValidPhone(String(phone))),
    },
    {
      id: "email",
      label: "Email informado",
      weight: 7,
      met: Boolean(email?.trim()),
    },
    {
      id: "cpf",
      label: "CPF válido",
      weight: 10,
      met: Boolean(cpf && isValidCpfDigits(stripDocumentDigits(cpf))),
    },
    {
      id: "questionnaire",
      label: "Questionário completo",
      weight: 15,
      met: isQuestionnaireComplete(input),
    },
    {
      id: "cep",
      label: "CEP válido",
      weight: 7,
      met: checklist.items.find((item) => item.id === "cep")?.completed === true,
    },
    {
      id: "vehicle",
      label: "Veículo identificado",
      weight: 8,
      met: checklist.items.find((item) => item.id === "vehicle")?.completed === true,
    },
    {
      id: "driver",
      label: "Condutor principal",
      weight: 5,
      met:
        checklist.items.find((item) => item.id === "main_driver")?.completed ===
        true,
    },
    {
      id: "product",
      label: "Produto informado",
      weight: 5,
      met: Boolean(input.deal.product?.trim()),
    },
    {
      id: "customer",
      label: "Cliente convertido",
      weight: 10,
      met: hasCustomer(input),
    },
    {
      id: "quote_created",
      label: "Cotação criada",
      weight: 10,
      met: quotes.hasComparison && quotes.lineCount > 0,
    },
    {
      id: "quote_selected",
      label: "Cotação selecionada",
      weight: 9,
      met: quotes.hasSelected,
    },
    {
      id: "proposal",
      label: "Proposta emitida",
      weight: 8,
      met: hasProposal(input),
    },
  ].map((item) => ({
    ...item,
    earned: item.met ? item.weight : 0,
  }))

  const value = criteria.reduce((sum, item) => sum + item.earned, 0)
  const tier = resolveTier(value)

  return {
    value,
    tier,
    tierLabel: SCORE_TIER_LABELS[tier],
    criteria,
  }
}

function buildRecommendations(
  input: CommercialJourneyInput,
  checklist: CommercialChecklist,
): CommercialRecommendation[] {
  const recommendations: CommercialRecommendation[] = []
  const answers = input.questionnaireAnswers ?? null
  const fields = input.questionnaireFields ?? []
  const quotes = quoteSummary(input)
  const product = input.deal.product

  const pending = new Set(checklist.pendingRequired.map((item) => item.id))

  if (pending.has("cpf")) {
    recommendations.push({
      id: "missing-cpf",
      message: "Informe o CPF do segurado para avançar na cotação.",
      priority: "high",
      relatedStageId: "questionnaire",
      relatedChecklistId: "cpf",
    })
  }

  if (
    isAutoProduct(product) &&
    isQuestionnaireComplete(input) &&
    !resolveQuestionnaireBonus(answers, fields)
  ) {
    recommendations.push({
      id: "missing-bonus",
      message: "Falta informar bônus.",
      priority: "medium",
      relatedStageId: "questionnaire",
    })
  }

  if (
    isAutoProduct(product) &&
    isQuestionnaireComplete(input) &&
    !resolveSecondDriver(answers, fields)
  ) {
    recommendations.push({
      id: "second-driver",
      message: "Adicionar segundo condutor pode melhorar a cotação.",
      priority: "low",
      relatedStageId: "questionnaire",
    })
  }

  if (!isQuestionnaireComplete(input)) {
    recommendations.push({
      id: "questionnaire-incomplete",
      message: "Questionário incompleto.",
      priority: "high",
      relatedStageId: "questionnaire",
      relatedChecklistId: "questionnaire_answered",
    })
  }

  if (quotes.hasSelected && !hasProposal(input)) {
    recommendations.push({
      id: "missing-proposal",
      message: "Cliente ainda não possui proposta.",
      priority: "high",
      relatedStageId: "proposal",
      relatedChecklistId: "proposal_issued",
    })
  }

  if (
    quotes.hasComparison &&
    quotes.lineCount > 0 &&
    !quotes.quoteSent
  ) {
    recommendations.push({
      id: "quote-not-sent",
      message: "Cotação não enviada.",
      priority: "medium",
      relatedStageId: "quotes",
      relatedChecklistId: "has_quote",
    })
  }

  if (pending.has("phone")) {
    recommendations.push({
      id: "missing-phone",
      message: "Cadastre um telefone válido para contato comercial.",
      priority: "high",
      relatedChecklistId: "phone",
    })
  }

  if (pending.has("cep")) {
    recommendations.push({
      id: "missing-cep",
      message: "Informe o CEP no questionário para completar o perfil de risco.",
      priority: "medium",
      relatedChecklistId: "cep",
    })
  }

  if (
    quotes.lineCount === 1 &&
    quotes.hasComparison
  ) {
    recommendations.push({
      id: "single-quote-line",
      message: "Adicione ao menos mais uma seguradora para comparar opções.",
      priority: "low",
      relatedStageId: "comparison",
    })
  }

  return recommendations.slice(0, 8)
}

function buildCorrelatedTimelineKinds(
  journey: CommercialJourneyStage[],
): string[] {
  const kinds = new Set<string>()

  for (const stage of journey) {
    if (stage.status !== "COMPLETED" && stage.status !== "IN_PROGRESS") continue
    switch (stage.id) {
      case "lead":
      case "qualification":
        kinds.add("lead_converted")
        break
      case "questionnaire":
        kinds.add("questionnaire_submitted")
        kinds.add("questionnaire_reviewed")
        break
      case "quotes":
      case "comparison":
        kinds.add("quote_created")
        kinds.add("quote_updated")
        kinds.add("quote_sent")
        break
      case "proposal":
        kinds.add("proposal_created")
        kinds.add("proposal_sent")
        break
      case "policy":
        kinds.add("policy_issued")
        break
      case "renewal":
        kinds.add("renewal_started")
        break
      default:
        break
    }
  }

  return [...kinds]
}

export class CommercialJourneyService {
  evaluate(input: CommercialJourneyInput): CommercialIntelligenceSnapshot {
    const checklist = buildChecklist(input)
    const journey = buildJourney(input)
    const score = buildScore(input, checklist)
    const recommendations = buildRecommendations(input, checklist)

    return {
      journey,
      checklist,
      score,
      recommendations,
      correlatedTimelineKinds: buildCorrelatedTimelineKinds(journey),
    }
  }
}

export const commercialJourneyService = new CommercialJourneyService()

export function evaluateCommercialIntelligence(input: CommercialJourneyInput) {
  return commercialJourneyService.evaluate(input)
}

export { JOURNEY_LABELS, SCORE_TIER_LABELS }
