"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type UniqueIdentifier,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { motion, useReducedMotion } from "framer-motion"

import type {
  CrmDeal,
  CrmStageId,
  DealPipelineUpdateInput,
} from "@/lib/data-access/modules/crm"
import { pipelineStages } from "@/lib/data-access/modules/crm"
import {
  getSortedStageDeals,
  hasDealPipelinePositionChanged,
  sortDealsForPipeline,
} from "@/lib/pipeline-order"
import { createPipelineCollisionDetection } from "@/lib/pipeline-collision"
import {
  logPipelineDnd,
  logPipelineDragOver,
} from "@/lib/pipeline-dnd-debug"
import {
  getPipelineOverType,
  pipelineStageOrderKey,
  resolvePipelineDragOverTarget,
  shouldUpdateStickyOver,
} from "@/lib/pipeline-drag-over"
import { reorderDeals, resolveDropStage } from "@/lib/pipeline-dnd"
import { PipelineColumn } from "@/components/crm/pipeline-column"
import { DealCard } from "@/components/crm/deal-card"
import { cn } from "@/lib/utils"

type PipelineBoardProps = {
  compact?: boolean
  interactive?: boolean
  onDealSelect?: (deal: CrmDeal) => void
  onDealEdit?: (deal: CrmDeal) => void
  onDealDelete?: (deal: CrmDeal) => void
  deals?: CrmDeal[]
  onDealMove?: (
    deal: CrmDeal,
    update: DealPipelineUpdateInput,
  ) => void | Promise<void>
}

export function PipelineBoard({
  compact,
  interactive = true,
  onDealSelect,
  onDealEdit,
  onDealDelete,
  deals: sourceDeals = [],
  onDealMove,
}: PipelineBoardProps) {
  const reduce = useReducedMotion()
  const [deals, setDeals] = useState<CrmDeal[]>(() =>
    sortDealsForPipeline(sourceDeals),
  )
  const [activeDeal, setActiveDeal] = useState<CrmDeal | null>(null)
  const [overStageId, setOverStageId] = useState<CrmStageId | null>(null)
  const dragSnapshotRef = useRef<CrmDeal[] | null>(null)
  const dealsRef = useRef(deals)
  const isDraggingRef = useRef(false)
  const persistInFlightRef = useRef(false)
  const lastProcessedOverRef = useRef<string | null>(null)
  const stickyOverRef = useRef<UniqueIdentifier | null>(null)
  const lastCollisionIdsRef = useRef<string>("")
  const overStageIdRef = useRef<CrmStageId | null>(null)
  const dragOverRafRef = useRef<number | null>(null)

  dealsRef.current = deals

  const activationConstraint = { distance: 8 } as const

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint }),
    useSensor(MouseSensor, { activationConstraint }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const activeId = activeDeal?.id ?? null

  const collisionDetection = useMemo(
    () =>
      createPipelineCollisionDetection((snapshot) => {
        lastCollisionIdsRef.current = snapshot.collisionIds
      }),
    [],
  )

  useEffect(() => {
    if (isDraggingRef.current || persistInFlightRef.current) return
    setDeals(sortDealsForPipeline(sourceDeals))
  }, [sourceDeals])

  const revertDragState = useCallback(() => {
    const snapshot = dragSnapshotRef.current
    if (snapshot) {
      setDeals(snapshot)
    } else {
      setDeals(sortDealsForPipeline(sourceDeals))
    }
    dragSnapshotRef.current = null
    isDraggingRef.current = false
    lastProcessedOverRef.current = null
    stickyOverRef.current = null
    lastCollisionIdsRef.current = ""
    overStageIdRef.current = null
    if (dragOverRafRef.current !== null) {
      cancelAnimationFrame(dragOverRafRef.current)
      dragOverRafRef.current = null
    }
    setActiveDeal(null)
    setOverStageId(null)
  }, [sourceDeals])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const snapshot = sortDealsForPipeline(dealsRef.current).map((deal) => ({
      ...deal,
    }))
    dragSnapshotRef.current = snapshot
    isDraggingRef.current = true
    lastProcessedOverRef.current = null
    stickyOverRef.current = null
    lastCollisionIdsRef.current = ""
    const deal = snapshot.find((item) => item.id === event.active.id) ?? null
    setActiveDeal(deal)
    logPipelineDnd("dragStart", {
      activeId: String(event.active.id),
      stageId: deal?.stage,
    })
  }, [])

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    logPipelineDnd("dragMove", {
      activeId: String(event.active.id),
      delta: event.delta,
    })
  }, [])

  const syncOverStageHighlight = useCallback(
    (overId: UniqueIdentifier, dealsList: CrmDeal[]) => {
      const stage = resolveDropStage(overId, dealsList)
      if (stage === overStageIdRef.current) return
      overStageIdRef.current = stage
      setOverStageId(stage)
    },
    [],
  )

  const applyDragOver = useCallback(
    (activeId: UniqueIdentifier, rawOverId: UniqueIdentifier) => {
      const current = dealsRef.current
      const effectiveOverId = resolvePipelineDragOverTarget(
        current,
        activeId,
        rawOverId,
        stickyOverRef.current,
      )

      if (!effectiveOverId) {
        return
      }

      const effectiveKey = String(effectiveOverId)

      logPipelineDragOver({
        activeId: String(activeId),
        overId: String(rawOverId),
        effectiveOverId: effectiveKey,
        overType: getPipelineOverType(effectiveOverId),
        rawOverType: getPipelineOverType(rawOverId),
        collisionIds: lastCollisionIdsRef.current,
        skippedSameOver: lastProcessedOverRef.current === effectiveKey,
        stickyOverId: stickyOverRef.current
          ? String(stickyOverRef.current)
          : "",
      })

      if (lastProcessedOverRef.current === effectiveKey) {
        return
      }
      lastProcessedOverRef.current = effectiveKey

      if (shouldUpdateStickyOver(effectiveOverId, current, activeId)) {
        stickyOverRef.current = effectiveOverId
      }

      const baseline = dragSnapshotRef.current ?? undefined
      const next = reorderDeals(
        current,
        activeId,
        effectiveOverId,
        baseline,
      )

      const activeDeal = current.find((deal) => deal.id === activeId)
      const orderUnchanged =
        activeDeal &&
        pipelineStageOrderKey(current, activeDeal.stage) ===
          pipelineStageOrderKey(next, activeDeal.stage)

      if (next === current || orderUnchanged) {
        syncOverStageHighlight(effectiveOverId, current)
        return
      }

      dealsRef.current = next
      setDeals(next)
      syncOverStageHighlight(effectiveOverId, next)
    },
    [syncOverStageHighlight],
  )

  const scheduleDragOver = useCallback(
    (activeId: UniqueIdentifier, rawOverId: UniqueIdentifier) => {
      if (dragOverRafRef.current !== null) {
        cancelAnimationFrame(dragOverRafRef.current)
      }
      dragOverRafRef.current = requestAnimationFrame(() => {
        dragOverRafRef.current = null
        applyDragOver(activeId, rawOverId)
      })
    },
    [applyDragOver],
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      logPipelineDnd("dragOver", {
        activeId: String(active.id),
        overId: over ? String(over.id) : null,
      })
      if (!over) {
        lastProcessedOverRef.current = null
        overStageIdRef.current = null
        setOverStageId(null)
        return
      }

      scheduleDragOver(active.id, over.id)
    },
    [scheduleDragOver],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      const snapshot = dragSnapshotRef.current

      logPipelineDnd("dragEnd", {
        activeId: String(active.id),
        overId: over ? String(over.id) : null,
        hasSnapshot: Boolean(snapshot),
      })

      const dropStickyOver = stickyOverRef.current

      setActiveDeal(null)
      setOverStageId(null)
      isDraggingRef.current = false
      dragSnapshotRef.current = null
      lastProcessedOverRef.current = null
      stickyOverRef.current = null
      lastCollisionIdsRef.current = ""
      overStageIdRef.current = null
      if (dragOverRafRef.current !== null) {
        cancelAnimationFrame(dragOverRafRef.current)
        dragOverRafRef.current = null
      }

      if (!over || !snapshot) {
        logPipelineDnd("dragEnd:revert", { reason: "no-over-or-snapshot" })
        revertDragState()
        return
      }

      const original = snapshot.find((deal) => deal.id === active.id)
      if (!original) {
        revertDragState()
        return
      }

      const dropOverId =
        resolvePipelineDragOverTarget(
          dealsRef.current,
          active.id,
          over.id,
          dropStickyOver,
        ) ?? over.id

      const finalDeals = reorderDeals(
        dealsRef.current,
        active.id,
        dropOverId,
        snapshot,
      )
      const moved = finalDeals.find((deal) => deal.id === active.id)
      if (!moved) {
        setDeals(snapshot)
        return
      }

      setDeals(finalDeals)

      if (!hasDealPipelinePositionChanged(original, moved)) {
        return
      }

      persistInFlightRef.current = true
      try {
        await onDealMove?.(moved, {
          stage: moved.stage,
          pipelineOrder: moved.pipelineOrder,
        })
      } catch {
        setDeals(snapshot)
      } finally {
        persistInFlightRef.current = false
      }
    },
    [onDealMove, revertDragState],
  )

  const handleDragCancel = useCallback((event: DragCancelEvent) => {
    logPipelineDnd("dragCancel", { activeId: String(event.active.id) })
    revertDragState()
  }, [revertDragState])

  const scrollClass = cn(
    "w-full min-w-0 min-h-0 flex-1 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]",
    "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10",
    !compact && "overflow-y-auto",
    compact && "max-h-[300px]",
  )

  const columnsClass = cn(
    "pipeline-board-v2 flex w-max min-w-full gap-3 px-0.5",
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
          deals={getSortedStageDeals(deals, stage.id)}
          interactive={interactive}
          isDropTarget={overStageId === stage.id && activeId !== null}
          onDealSelect={onDealSelect}
          onDealEdit={onDealEdit}
          onDealDelete={onDealDelete}
        />
      )),
    [
      compact,
      deals,
      interactive,
      onDealDelete,
      onDealEdit,
      onDealSelect,
      overStageId,
      activeId,
    ],
  )

  const boardContent = (
    <div className={scrollClass}>
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className={columnsClass}
      >
        {columns}
      </motion.div>
    </div>
  )

  if (!interactive) {
    return boardContent
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className={scrollClass}
        role="region"
        aria-label="Pipeline Kanban com arrastar e soltar"
      >
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className={columnsClass}
        >
          {columns}
        </motion.div>
      </div>

      <DragOverlay
        style={{ zIndex: 100 }}
        dropAnimation={{
          duration: 220,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {activeDeal ? (
          <div className="pipeline-drag-overlay w-[268px] rotate-[1.25deg] scale-[1.02]">
            <DealCard deal={activeDeal} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
