import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import { allPipelineStages } from "@/lib/data-access/modules/crm"

export const PIPELINE_ORDER_STEP = 1000

const stageRank = Object.fromEntries(
  allPipelineStages.map((stage, index) => [stage.id, index]),
) as Record<CrmStageId, number>

export function normalizePipelineOrder(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function sortDealsForPipeline(deals: CrmDeal[]) {
  return [...deals].sort(compareDealsForPipeline)
}

/**
 * Ordena por etapa e pipelineOrder preservando a ordem atual do array nos empates.
 * É a mesma visão que o quadro renderiza (getSortedStageDeals); usar o desempate por
 * createdAt aqui faria o reorder discordar da tela quando há pipelineOrder repetido.
 */
export function sortDealsKeepingTies(deals: CrmDeal[]) {
  return allPipelineStages
    .map((stage) => stage.id)
    .filter((id, index, ids) => ids.indexOf(id) === index)
    .flatMap((stageId) => getSortedStageDeals(deals, stageId))
}

export function compareDealsForPipeline(a: CrmDeal, b: CrmDeal) {
  const stageDiff = stageRank[a.stage] - stageRank[b.stage]
  if (stageDiff !== 0) return stageDiff

  const orderDiff = a.pipelineOrder - b.pipelineOrder
  if (orderDiff !== 0) return orderDiff

  return a.createdAt.localeCompare(b.createdAt)
}

export function getSortedStageDeals(deals: CrmDeal[], stageId: CrmStageId) {
  return deals
    .filter((deal) => deal.stage === stageId)
    .sort((a, b) => a.pipelineOrder - b.pipelineOrder)
}

/** Ordem ao inserir na posição `insertIndex` (lista já ordenada, sem o card ativo). */
export function computePipelineOrderAtIndex(
  stageDeals: CrmDeal[],
  insertIndex: number,
) {
  if (stageDeals.length === 0) return PIPELINE_ORDER_STEP

  if (insertIndex <= 0) {
    return stageDeals[0]!.pipelineOrder / 2
  }

  if (insertIndex >= stageDeals.length) {
    return stageDeals[stageDeals.length - 1]!.pipelineOrder + PIPELINE_ORDER_STEP
  }

  const prev = stageDeals[insertIndex - 1]!
  const next = stageDeals[insertIndex]!
  return (prev.pipelineOrder + next.pipelineOrder) / 2
}

export type DealPipelineMove = {
  stage: CrmStageId
  pipelineOrder: number
}

export function hasDealPipelinePositionChanged(
  before: CrmDeal,
  after: CrmDeal,
) {
  return before.stage !== after.stage || before.pipelineOrder !== after.pipelineOrder
}

/**
 * Empates de pipelineOrder (ex.: vários 0) impedem calcular uma posição intermediária
 * e a API desempata por createdAt. Se o card movido não ficar estritamente entre os
 * vizinhos, renumera a etapa inteira mantendo a ordem visual.
 */
export function ensureDistinctPipelineOrder(
  deals: CrmDeal[],
  dealId: string,
): CrmDeal[] {
  const moved = deals.find((deal) => deal.id === dealId)
  if (!moved) return deals

  const stageDeals = getSortedStageDeals(deals, moved.stage)
  const index = stageDeals.findIndex((deal) => deal.id === dealId)
  const prev = stageDeals[index - 1]
  const next = stageDeals[index + 1]
  const isDistinct =
    (!prev || prev.pipelineOrder < moved.pipelineOrder) &&
    (!next || moved.pipelineOrder < next.pipelineOrder)
  if (isDistinct) return deals

  const renumbered = new Map(
    stageDeals.map((deal, position) => [
      deal.id,
      (position + 1) * PIPELINE_ORDER_STEP,
    ]),
  )
  return deals.map((deal) => {
    const pipelineOrder = renumbered.get(deal.id)
    return pipelineOrder === undefined ? deal : { ...deal, pipelineOrder }
  })
}

export function listPipelinePositionChanges(
  before: CrmDeal[],
  after: CrmDeal[],
): CrmDeal[] {
  const previous = new Map(before.map((deal) => [deal.id, deal]))
  return after.filter((deal) => {
    const prior = previous.get(deal.id)
    return !prior || hasDealPipelinePositionChanged(prior, deal)
  })
}
