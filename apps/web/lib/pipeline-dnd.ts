import type { UniqueIdentifier } from "@dnd-kit/core"

import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import { pipelineStages } from "@/lib/data-access/modules/crm"

import {
  logPipelineDnd,
  pipelineDndDebugEnabled,
} from "./pipeline-dnd-debug"
import {
  computePipelineOrderAtIndex,
  getSortedStageDeals,
  sortDealsForPipeline,
} from "./pipeline-order"

export const stageDroppableId = (stageId: CrmStageId) => `stage:${stageId}`

export function parseStageId(id: UniqueIdentifier): CrmStageId | null {
  const value = String(id)
  if (!value.startsWith("stage:")) return null
  const stage = value.slice(6) as CrmStageId
  return pipelineStages.some((s) => s.id === stage) ? stage : null
}

export function resolveDropStage(
  overId: UniqueIdentifier | undefined,
  deals: CrmDeal[],
): CrmStageId | null {
  if (!overId) return null
  const stage = parseStageId(overId)
  if (stage) return stage
  return deals.find((d) => d.id === overId)?.stage ?? null
}

export function getDealsForStage(deals: CrmDeal[], stageId: CrmStageId) {
  return getSortedStageDeals(deals, stageId)
}

export function getStageValue(deals: CrmDeal[], stageId: CrmStageId) {
  return getDealsForStage(deals, stageId).reduce((sum, d) => sum + d.value, 0)
}

export type ReorderInsertDebug = {
  activeId: string
  overId: string
  activeIndex: number
  overIndex: number
  targetIndex: number
  currentActiveIndex: number
  currentOverIndex: number
  sameColumn: boolean
  movingDown: boolean
  alreadyApplied: boolean
  skipReason?: string
}

function stageDealIds(deals: CrmDeal[], stageId: CrmStageId) {
  return getSortedStageDeals(deals, stageId).map((deal) => deal.id)
}

/**
 * Índice de inserção na lista da coluna alvo (sem o card ativo).
 * A direção (subir vs descer) usa a ordem de referência no início do drag —
 * não a lista já reordenada durante dragOver (evita flip ao mover para cima).
 */
function findInsertIndex(
  stageDealsWithoutActive: CrmDeal[],
  overId: UniqueIdentifier,
  activeId: UniqueIdentifier,
  referenceStageDeals: CrmDeal[],
  currentStageDeals: CrmDeal[],
  activeStage: CrmStageId,
  targetStage: CrmStageId,
): { insertIndex: number; debug: ReorderInsertDebug } {
  const activeIdStr = String(activeId)
  const overIdStr = String(overId)
  const sameColumn = activeStage === targetStage
  const activeIndex = referenceStageDeals.findIndex((deal) => deal.id === activeId)
  const currentActiveIndex = currentStageDeals.findIndex((deal) => deal.id === activeId)
  const currentOverIndex = currentStageDeals.findIndex((deal) => deal.id === overId)

  const overIndexInReference = referenceStageDeals.findIndex(
    (deal) => deal.id === overId,
  )

  const movingDown =
    sameColumn &&
    activeIndex >= 0 &&
    overIndexInReference >= 0 &&
    activeIndex < overIndexInReference

  const baseDebug = {
    activeId: activeIdStr,
    overId: overIdStr,
    activeIndex,
    overIndex: overIndexInReference,
    currentActiveIndex,
    currentOverIndex,
    sameColumn,
    movingDown,
    alreadyApplied: false,
  } satisfies Omit<ReorderInsertDebug, "targetIndex" | "skipReason">

  if (parseStageId(overId)) {
    let targetIndex = stageDealsWithoutActive.length
    if (
      sameColumn &&
      activeIndex > 0 &&
      currentActiveIndex === 0
    ) {
      targetIndex = 0
    }
    return {
      insertIndex: targetIndex,
      debug: { ...baseDebug, targetIndex },
    }
  }

  const overIndex = stageDealsWithoutActive.findIndex((deal) => deal.id === overId)
  if (overIndex < 0) {
    const targetIndex = stageDealsWithoutActive.length
    return {
      insertIndex: targetIndex,
      debug: { ...baseDebug, targetIndex },
    }
  }

  const targetIndex = movingDown ? overIndex + 1 : overIndex

  return {
    insertIndex: targetIndex,
    debug: { ...baseDebug, targetIndex },
  }
}

function logReorderInsert(debug: ReorderInsertDebug) {
  logPipelineDnd("reorderInsert", debug)
  if (!pipelineDndDebugEnabled) return
  console.table({
    activeId: debug.activeId,
    overId: debug.overId,
    activeIndex: debug.activeIndex,
    overIndex: debug.overIndex,
    targetIndex: debug.targetIndex,
    movingDown: debug.movingDown,
    alreadyApplied: debug.alreadyApplied,
    currentActiveIndex: debug.currentActiveIndex,
    currentOverIndex: debug.currentOverIndex,
    skipReason: debug.skipReason ?? "",
  })
}

function rebuildDealsByStage(
  withoutActive: CrmDeal[],
  targetStage: CrmStageId,
  targetStageDeals: CrmDeal[],
) {
  const result: CrmDeal[] = []

  for (const stage of pipelineStages) {
    if (stage.id === targetStage) {
      result.push(...targetStageDeals)
    } else {
      result.push(...getSortedStageDeals(withoutActive, stage.id))
    }
  }

  return result
}

/** Move/reordena negócio e recalcula pipelineOrder (single-card update). */
export function reorderDeals(
  deals: CrmDeal[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier | undefined,
  /** Snapshot do início do drag — mantém direção correta durante dragOver. */
  dragBaseline?: CrmDeal[],
): CrmDeal[] {
  if (!overId || activeId === overId) return deals

  const sorted = sortDealsForPipeline(deals)
  const activeDeal = sorted.find((deal) => deal.id === activeId)
  if (!activeDeal) return deals

  const targetStage = resolveDropStage(overId, sorted)
  if (!targetStage) return deals

  const baselineSorted = dragBaseline
    ? sortDealsForPipeline(dragBaseline)
    : sorted
  const referenceStageDeals = getSortedStageDeals(
    baselineSorted,
    activeDeal.stage,
  )
  const withoutActive = sorted.filter((deal) => deal.id !== activeId)
  const targetListWithoutActive = getSortedStageDeals(withoutActive, targetStage)
  const currentStageDeals = getSortedStageDeals(sorted, targetStage)
  const { insertIndex, debug: insertDebug } = findInsertIndex(
    targetListWithoutActive,
    overId,
    activeId,
    referenceStageDeals,
    currentStageDeals,
    activeDeal.stage,
    targetStage,
  )

  const sameColumn = activeDeal.stage === targetStage
  const currentActiveIndex = currentStageDeals.findIndex(
    (deal) => deal.id === activeId,
  )
  const currentOverIndex = currentStageDeals.findIndex(
    (deal) => deal.id === overId,
  )

  let skipReason: string | undefined

  if (
    sameColumn &&
    !insertDebug.movingDown &&
    currentActiveIndex >= 0 &&
    currentOverIndex >= 0 &&
    currentActiveIndex < currentOverIndex
  ) {
    skipReason = "already-above-over"
  }

  if (
    sameColumn &&
    currentActiveIndex >= 0 &&
    currentActiveIndex === insertIndex
  ) {
    skipReason = skipReason ?? "active-at-target-index"
  }

  const targetStageDealsPreview = [...targetListWithoutActive]
  targetStageDealsPreview.splice(insertIndex, 0, activeDeal)
  const currentOrderIds = stageDealIds(sorted, targetStage)
  const nextOrderIds = targetStageDealsPreview.map((deal) => deal.id)

  if (
    !skipReason &&
    JSON.stringify(currentOrderIds) === JSON.stringify(nextOrderIds)
  ) {
    skipReason = "order-unchanged"
  }

  if (skipReason) {
    logReorderInsert({
      ...insertDebug,
      alreadyApplied: true,
      skipReason,
    })
    return deals
  }

  logReorderInsert(insertDebug)

  const pipelineOrder = computePipelineOrderAtIndex(
    targetListWithoutActive,
    insertIndex,
  )

  const moved: CrmDeal = {
    ...activeDeal,
    stage: targetStage,
    pipelineOrder,
  }

  const targetStageDeals = [...targetListWithoutActive]
  targetStageDeals.splice(insertIndex, 0, moved)

  const rebuiltOrderIds = targetStageDeals.map((deal) => deal.id)
  if (JSON.stringify(currentOrderIds) === JSON.stringify(rebuiltOrderIds)) {
    logReorderInsert({
      ...insertDebug,
      alreadyApplied: true,
      skipReason: "rebuilt-order-unchanged",
    })
    return deals
  }

  return rebuildDealsByStage(withoutActive, targetStage, targetStageDeals)
}

export {
  getSortedStageDeals,
  sortDealsForPipeline,
} from "./pipeline-order"
