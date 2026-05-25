"use client"

import { useCallback } from "react"
import { useDraggable, useDroppable } from "@dnd-kit/core"

import type { CrmDeal } from "@/lib/data-access/modules/crm"
import { DealCard } from "@/components/crm/deal-card"
import { cn } from "@/lib/utils"

type DraggableDealCardProps = {
  deal: CrmDeal
  index?: number
  onSelect?: (deal: CrmDeal) => void
  onEdit?: (deal: CrmDeal) => void
  onDelete?: (deal: CrmDeal) => void
  disabled?: boolean
  compact?: boolean
}

export function DraggableDealCard({
  deal,
  index = 0,
  onSelect,
  onEdit,
  onDelete,
  disabled,
  compact,
}: DraggableDealCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { type: "deal", deal, stageId: deal.stage },
    disabled,
  })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: deal.id,
    data: { type: "deal", deal, stageId: deal.stage },
    disabled: disabled || isDragging,
  })

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node)
      setDroppableRef(node)
    },
    [setNodeRef, setDroppableRef],
  )

  return (
    <div
      ref={setRef}
      className={cn(
        "min-w-0 max-w-full touch-none",
        isDragging && "opacity-[0.35] saturate-50",
        !disabled && "cursor-grab active:cursor-grabbing",
      )}
      {...(disabled ? {} : listeners)}
      {...(disabled ? {} : attributes)}
    >
      <DealCard
        deal={deal}
        index={index}
        isDragging={isDragging}
        canDrag={!disabled}
        compact={compact}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onSelect ? () => onSelect(deal) : undefined}
      />
    </div>
  )
}
