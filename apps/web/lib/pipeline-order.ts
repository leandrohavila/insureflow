import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import { pipelineStages } from "@/lib/data-access/modules/crm"

export const PIPELINE_ORDER_STEP = 1000

const stageRank = Object.fromEntries(
  pipelineStages.map((stage, index) => [stage.id, index]),
) as Record<CrmStageId, number>

export function normalizePipelineOrder(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function sortDealsForPipeline(deals: CrmDeal[]) {
  return [...deals].sort(compareDealsForPipeline)
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
