"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { motion, useReducedMotion } from "framer-motion"

import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import { pipelineStages } from "@/lib/data-access/modules/crm"
import { reorderDeals, resolveDropStage } from "@/lib/pipeline-dnd"
import { PipelineColumn } from "@/components/crm/pipeline-column"
import { DealCard } from "@/components/crm/deal-card"
import { cn } from "@/lib/utils"

type PipelineBoardProps = {
  compact?: boolean
  interactive?: boolean
  onDealSelect?: (deal: CrmDeal) => void
  deals?: CrmDeal[]
  onDealStageChange?: (deal: CrmDeal, stage: CrmStageId) => void
}

export function PipelineBoard({
  compact,
  interactive = true,
  onDealSelect,
  deals: sourceDeals = [],
  onDealStageChange,
}: PipelineBoardProps) {
  const reduce = useReducedMotion()
  const [deals, setDeals] = useState<CrmDeal[]>(sourceDeals)
  const [activeDeal, setActiveDeal] = useState<CrmDeal | null>(null)
  const [overStageId, setOverStageId] = useState<CrmStageId | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const activeId = activeDeal?.id ?? null

  useEffect(() => {
    setDeals(sourceDeals)
  }, [sourceDeals])

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const deal = deals.find((d) => d.id === event.active.id)
      if (deal) setActiveDeal(deal)
    },
    [deals],
  )

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (!over) {
      setOverStageId(null)
      return
    }
    setDeals((current) => {
      setOverStageId(resolveDropStage(over.id, current))
      return reorderDeals(current, active.id, over.id)
    })
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      const deal = activeDeal ?? deals.find((d) => d.id === active.id)
      const nextStage = over ? resolveDropStage(over.id, deals) : null
      if (over) {
        setDeals((current) => reorderDeals(current, active.id, over.id))
      }
      if (deal && nextStage && nextStage !== deal.stage) {
        onDealStageChange?.(deal, nextStage)
      }
      setActiveDeal(null)
      setOverStageId(null)
    },
    [activeDeal, deals, onDealStageChange],
  )

  const handleDragCancel = useCallback(() => {
    setActiveDeal(null)
    setOverStageId(null)
  }, [])

  const boardClass = cn(
    "flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:thin]",
    "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10",
    compact && "max-h-[300px]",
    activeId && "pipeline-board--dragging",
  )

  const columns = useMemo(
    () =>
      pipelineStages.map((stage, i) => (
        <PipelineColumn
          key={stage.id}
          stageId={stage.id}
          label={stage.label}
          accent={stage.accent}
          columnIndex={i}
          compact={compact}
          deals={deals.filter((d) => d.stage === stage.id)}
          interactive={interactive}
          isDropTarget={overStageId === stage.id && activeId !== null}
          onDealSelect={onDealSelect}
        />
      )),
    [compact, deals, interactive, onDealSelect, overStageId, activeId],
  )

  if (!interactive) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className={boardClass}
      >
        {columns}
      </motion.div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className={boardClass}
        role="region"
        aria-label="Pipeline Kanban com arrastar e soltar"
      >
        {columns}
      </motion.div>

      <DragOverlay
        dropAnimation={{
          duration: 220,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {activeDeal ? (
          <div className="pipeline-drag-overlay w-[272px] rotate-[1.5deg] scale-[1.03]">
            <DealCard deal={activeDeal} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
