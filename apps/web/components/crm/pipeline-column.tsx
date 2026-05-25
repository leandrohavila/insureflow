"use client"

import { useDroppable } from "@dnd-kit/core"
import { motion, useReducedMotion } from "framer-motion"
import { Plus } from "lucide-react"
import type { CSSProperties } from "react"

import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import { formatCurrency } from "@/lib/data-access/modules/crm"
import { stageDroppableId } from "@/lib/pipeline-dnd"
import { STAGE_ACCENT_VAR } from "@/components/crm/sheet-sections/deal-shared"
import { DealCard } from "@/components/crm/deal-card"
import { DraggableDealCard } from "@/components/crm/draggable-deal-card"
import { cn } from "@/lib/utils"
import { easeOut } from "@/lib/motion"

type PipelineColumnProps = {
  stageId: CrmStageId
  label: string
  accent: string
  columnIndex: number
  deals: CrmDeal[]
  compact?: boolean
  interactive?: boolean
  isDropTarget?: boolean
  onDealSelect?: (deal: CrmDeal) => void
  onDealEdit?: (deal: CrmDeal) => void
  onDealDelete?: (deal: CrmDeal) => void
}

export function PipelineColumn({
  stageId,
  label,
  accent,
  columnIndex,
  deals,
  compact,
  interactive = true,
  isDropTarget,
  onDealSelect,
  onDealEdit,
  onDealDelete,
}: PipelineColumnProps) {
  void accent
  const reduce = useReducedMotion()
  const total = deals.reduce((sum, d) => sum + d.value, 0)
  const stageAccent = STAGE_ACCENT_VAR[stageId]

  const { setNodeRef, isOver } = useDroppable({
    id: stageDroppableId(stageId),
    data: { type: "stage", stageId },
    disabled: !interactive,
  })

  const highlighted = isDropTarget || isOver

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * columnIndex, duration: 0.4, ease: easeOut }}
      className={cn(
        "pipeline-lane flex shrink-0 flex-col",
        compact ? "w-[212px]" : "w-[252px] sm:w-[268px]",
      )}
      style={{ ["--crm-lane-accent" as string]: stageAccent } as CSSProperties}
      aria-label={`Coluna ${label}`}
    >
      {/* Sticky header — métricas compactas */}
      <header className="pipeline-lane__header sticky top-0 z-[1] pb-2">
        <div className="pipeline-lane__header-accent" aria-hidden />
        <div className="flex items-center justify-between gap-2 px-0.5 pt-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="crm-text-title truncate text-[12.5px]">{label}</h3>
            <span className="pipeline-lane__count tabular-nums">
              {deals.length}
            </span>
          </div>
          <span className="crm-text-metric crm-text-meta shrink-0 font-medium tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </header>

      {/* Workspace lane — cards scrollam aqui */}
      <div
        ref={setNodeRef}
        className={cn(
          "pipeline-lane__body relative flex flex-1 flex-col gap-1.5",
          compact
            ? "min-h-[140px] max-h-[220px] overflow-y-auto"
            : "min-h-[min(380px,52vh)]",
          highlighted && "pipeline-lane__body--highlight",
        )}
      >
        {highlighted ? (
          <div
            className="pipeline-lane__drop-glow pointer-events-none absolute inset-0 rounded-lg"
            aria-hidden
          />
        ) : null}

        {deals.map((deal, i) =>
          interactive ? (
            <DraggableDealCard
              key={deal.id}
              deal={deal}
              index={i}
              compact={compact}
              onSelect={onDealSelect}
              onEdit={onDealEdit}
              onDelete={onDealDelete}
            />
          ) : (
            <DealCard
              key={deal.id}
              deal={deal}
              index={i}
              compact={compact}
              onClick={onDealSelect ? () => onDealSelect(deal) : undefined}
              onEdit={onDealEdit}
              onDelete={onDealDelete}
            />
          ),
        )}

        {deals.length === 0 ? (
          <div
            className={cn(
              "pipeline-lane__empty flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg px-4 py-8 text-center",
              highlighted && "pipeline-lane__empty--highlight",
            )}
          >
            <Plus
              className={cn("size-3.5 opacity-45", highlighted && "text-primary")}
              strokeWidth={1.5}
            />
            <p className="crm-text-micro leading-snug">
              {highlighted ? "Solte aqui" : "Arraste negócios"}
            </p>
          </div>
        ) : null}
      </div>
    </motion.section>
  )
}
