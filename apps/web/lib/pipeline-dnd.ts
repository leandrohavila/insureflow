import type { UniqueIdentifier } from "@dnd-kit/core"

import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import { pipelineStages } from "@/lib/data-access/modules/crm"

export const stageDroppableId = (stageId: CrmStageId) => `stage:${stageId}`

export function parseStageId(id: UniqueIdentifier): CrmStageId | null {
  const value = String(id)
  if (!value.startsWith("stage:")) return null
  const stage = value.slice(6) as CrmStageId
  return pipelineStages.some((s) => s.id === stage) ? stage : null
}

export function resolveDropStage(
  overId: UniqueIdentifier | undefined,
  deals: CrmDeal[]
): CrmStageId | null {
  if (!overId) return null
  const stage = parseStageId(overId)
  if (stage) return stage
  return deals.find((d) => d.id === overId)?.stage ?? null
}

export function getDealsForStage(deals: CrmDeal[], stageId: CrmStageId): CrmDeal[] {
  return deals.filter((d) => d.stage === stageId)
}

export function getStageValue(deals: CrmDeal[], stageId: CrmStageId): number {
  return getDealsForStage(deals, stageId).reduce((sum, d) => sum + d.value, 0)
}

/** Reordena / move negócio para a coluna ou posição alvo. */
export function reorderDeals(
  deals: CrmDeal[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier | undefined
): CrmDeal[] {
  if (!overId || activeId === overId) return deals

  const activeIndex = deals.findIndex((d) => d.id === activeId)
  if (activeIndex === -1) return deals

  const overStage = resolveDropStage(overId, deals)
  if (!overStage) return deals

  const activeDeal = deals[activeIndex]!
  const rest = deals.filter((d) => d.id !== activeId)
  const moved: CrmDeal = { ...activeDeal, stage: overStage }

  const overDealIndex = rest.findIndex((d) => d.id === overId)
  if (overDealIndex >= 0) {
    const next = [...rest]
    next.splice(overDealIndex, 0, moved)
    return dealsEqual(deals, next) ? deals : next
  }

  const stageOrder = pipelineStages.map((s) => s.id)
  const stageDeals = rest.filter((d) => d.stage === overStage)
  let insertAt = rest.length

  if (stageDeals.length > 0) {
    const last = stageDeals[stageDeals.length - 1]
    insertAt = rest.findIndex((d) => d.id === last!.id) + 1
  } else {
    const nextStageIdx = stageOrder.indexOf(overStage) + 1
    const nextStage = stageOrder[nextStageIdx]
    if (nextStage) {
      const firstOfNext = rest.findIndex((d) => d.stage === nextStage)
      if (firstOfNext >= 0) insertAt = firstOfNext
    }
  }

  const next = [...rest]
  next.splice(insertAt, 0, moved)
  return dealsEqual(deals, next) ? deals : next
}

function dealsEqual(a: CrmDeal[], b: CrmDeal[]): boolean {
  if (a.length !== b.length) return false
  return a.every((d, i) => d.id === b[i]?.id && d.stage === b[i]?.stage)
}
