"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

import type { CrmDeal } from "@/lib/data-access/modules/crm"
import { DealCard } from "@/components/crm/deal-card"
import { cn } from "@/lib/utils"

type DraggableDealCardProps = {
  deal: CrmDeal
  index?: number
  onSelect?: (deal: CrmDeal) => void
  disabled?: boolean
}

export function DraggableDealCard({
  deal,
  index = 0,
  onSelect,
  disabled,
}: DraggableDealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: deal.id,
      data: { type: "deal", deal },
      disabled,
    })

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none",
        isDragging && "opacity-[0.35] saturate-50",
        !disabled && "cursor-grab active:cursor-grabbing",
      )}
      {...listeners}
      {...attributes}
    >
      <DealCard
        deal={deal}
        index={index}
        isDragging={isDragging}
        onClick={onSelect ? () => onSelect(deal) : undefined}
      />
    </div>
  )
}
