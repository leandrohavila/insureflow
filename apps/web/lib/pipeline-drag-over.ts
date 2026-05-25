import type { UniqueIdentifier } from "@dnd-kit/core"

import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import { getSortedStageDeals } from "@/lib/pipeline-order"
import { isStageDroppableId } from "@/lib/pipeline-collision"
import { parseStageId } from "@/lib/pipeline-dnd"

export type PipelineOverType = "deal" | "stage" | "none"

export function getPipelineOverType(
  overId: UniqueIdentifier | null | undefined,
): PipelineOverType {
  if (!overId) return "none"
  return isStageDroppableId(overId) ? "stage" : "deal"
}

export function pipelineStageOrderKey(deals: CrmDeal[], stageId: CrmStageId) {
  return getSortedStageDeals(deals, stageId)
    .map((deal) => deal.id)
    .join(",")
}

/**
 * Converte stage:* em alvo de card quando a coluna já tem cards — evita
 * alternância stage↔card que dispara reorders opostos (loop de setState).
 */
export function resolvePipelineDragOverTarget(
  deals: CrmDeal[],
  activeId: UniqueIdentifier,
  rawOverId: UniqueIdentifier,
  stickyOverId: UniqueIdentifier | null,
): UniqueIdentifier | null {
  const activeDeal = deals.find((deal) => deal.id === activeId)
  if (!activeDeal) return rawOverId

  let target = rawOverId

  if (isStageDroppableId(target)) {
    const stage = parseStageId(target)
    if (stage) {
      const columnDeals = getSortedStageDeals(deals, stage)
      const activeIndex = columnDeals.findIndex((deal) => deal.id === activeId)
      const sameColumn = stage === activeDeal.stage

      if (sameColumn && columnDeals.length > 1) {
        if (activeIndex < columnDeals.length - 1) {
          if (stickyOverId) return stickyOverId
          if (activeIndex <= 0) return null
          return columnDeals[0]!.id
        }
      }
    }
  }

  target = resolveStickyPipelineOver(deals, activeId, target, stickyOverId)
  return target
}

/**
 * Com o card já no topo, ignora hovers em cards abaixo ou na coluna (stage:*)
 * que só refletem oscilação do collision detector.
 */
export function resolveStickyPipelineOver(
  deals: CrmDeal[],
  activeId: UniqueIdentifier,
  rawOverId: UniqueIdentifier,
  stickyOverId: UniqueIdentifier | null,
): UniqueIdentifier {
  if (!stickyOverId || stickyOverId === rawOverId) return rawOverId

  const activeDeal = deals.find((deal) => deal.id === activeId)
  if (!activeDeal) return rawOverId

  const stageDeals = getSortedStageDeals(deals, activeDeal.stage)
  const activeIndex = stageDeals.findIndex((deal) => deal.id === activeId)
  if (activeIndex !== 0) return rawOverId

  if (isStageDroppableId(rawOverId)) {
    return stickyOverId
  }

  const rawOverIndex = stageDeals.findIndex((deal) => deal.id === rawOverId)
  if (rawOverIndex > activeIndex) return stickyOverId

  return rawOverId
}

export function shouldUpdateStickyOver(
  overId: UniqueIdentifier,
  deals: CrmDeal[],
  activeId: UniqueIdentifier,
): boolean {
  if (isStageDroppableId(overId)) return false

  const activeDeal = deals.find((deal) => deal.id === activeId)
  if (!activeDeal) return true

  const stageDeals = getSortedStageDeals(deals, activeDeal.stage)
  const overIndex = stageDeals.findIndex((deal) => deal.id === overId)
  const activeIndex = stageDeals.findIndex((deal) => deal.id === activeId)
  if (overIndex < 0 || activeIndex < 0) return true

  return overIndex <= activeIndex
}
