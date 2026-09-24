"use client"

import { useDroppable } from "@dnd-kit/core"
import { motion, useReducedMotion } from "framer-motion"
import { Plus } from "lucide-react"
import type { CSSProperties } from "react"

import type { CrmDeal, CrmStageId } from "@/lib/data-access/modules/crm"
import { formatCurrency } from "@/lib/data-access/modules/crm"
import { stageDroppableId } from "@/lib/pipeline-dnd"
import { resolvePipelineDensity } from "@/lib/crm/pipeline-density"
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
  laneWidthPx?: number
  fitted?: boolean
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
  laneWidthPx,
  fitted = false,
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
  const density = resolvePipelineDensity(compact ? "compact" : "comfortable")

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * columnIndex, duration: 0.4, ease: easeOut }}
      data-crm-density={density.dataDensity}
      className={cn(
        "pipeline-lane flex h-full min-h-0 flex-col",
        fitted ? "min-w-0 flex-1" : "shrink-0 grow-0",
        density.laneClassName,
      )}
      style={{
        ["--crm-lane-accent" as string]: stageAccent,
        width: fitted ? undefined : (laneWidthPx ?? density.laneMinWidthPx),
        minWidth: fitted ? 0 : (laneWidthPx ?? density.laneMinWidthPx),
        maxWidth: fitted ? density.laneWidthPx : undefined,
      } as CSSProperties}
      aria-label={`Coluna ${label}`}
    >
      <header
        className={cn(
          "pipeline-lane__header shrink-0 sticky top-0 z-[1]",
          density.headerClassName,
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b border-white/10 px-1",
            density.headerPaddingClassName,
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <h3
              className={cn(
                "crm-text-title truncate",
                density.compact ? "text-[12px]" : "text-sm",
              )}
            >
              {label}
            </h3>
            <span className="pipeline-lane__count tabular-nums">{deals.length}</span>
          </div>
          <span
            className={cn(
              "crm-text-metric shrink-0 font-medium tabular-nums text-foreground/70",
              density.compact ? "text-[11px]" : "text-[13px]",
            )}
          >
            {formatCurrency(total)}
          </span>
        </div>
      </header>

      {/* Workspace lane — cards scrollam aqui */}
      <div
        ref={setNodeRef}
        className={cn(
          "pipeline-lane__body relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain",
          highlighted && "pipeline-lane__body--highlight",
        )}
        style={{ gap: density.columnGapPx }}
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
              "pipeline-lane__empty flex flex-col items-center justify-start gap-1.5 rounded-lg px-2 py-3 text-center",
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
