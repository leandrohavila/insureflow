"use client"

import { useDroppable } from "@dnd-kit/core"
import { motion, useReducedMotion } from "framer-motion"
import { Plus } from "lucide-react"

import type { CrmDeal, CrmStageId } from "@/lib/crm-mock"
import { formatCurrency } from "@/lib/crm-mock"
import { stageDroppableId } from "@/lib/pipeline-dnd"
import { DealCard } from "@/components/crm/deal-card"
import { DraggableDealCard } from "@/components/crm/draggable-deal-card"
import { cn } from "@/lib/utils"
import { easeOut } from "@/lib/motion"

const accentBar: Record<string, string> = {
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  primary: "bg-primary",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
}

const accentGlow: Record<string, string> = {
  sky: "shadow-sky-500/20",
  violet: "shadow-violet-500/20",
  primary: "shadow-primary/25",
  amber: "shadow-amber-500/20",
  emerald: "shadow-emerald-500/20",
}

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
}: PipelineColumnProps) {
  const reduce = useReducedMotion()
  const total = deals.reduce((sum, d) => sum + d.value, 0)

  const { setNodeRef, isOver } = useDroppable({
    id: stageDroppableId(stageId),
    data: { type: "stage", stageId },
    disabled: !interactive,
  })

  const highlighted = isDropTarget || isOver

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * columnIndex, duration: 0.45, ease: easeOut }}
      className={cn(
        "flex shrink-0 flex-col",
        compact ? "w-[220px]" : "w-[min(100%,280px)] sm:w-[272px]"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2 px-0.5">
        <motion.div className="flex min-w-0 items-center gap-2">
          <span className={cn("h-4 w-1 shrink-0 rounded-full", accentBar[accent])} />
          <h3 className="truncate text-[13px] font-semibold tracking-[-0.02em] text-foreground">
            {label}
          </h3>
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[11px] font-semibold tabular-nums text-muted-foreground">
            {deals.length}
          </span>
        </motion.div>
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
          {formatCurrency(total)}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "relative flex flex-1 flex-col gap-2.5 rounded-xl border p-2 transition-[border-color,box-shadow,background] duration-300",
          "border-white/[0.06] bg-white/[0.02]",
          compact ? "min-h-[160px] max-h-[240px] overflow-y-auto" : "min-h-[min(420px,55vh)]",
          highlighted &&
            cn(
              "border-primary/40 bg-primary/[0.06] shadow-lg ring-2 ring-primary/25",
              accentGlow[accent]
            )
        )}
      >
        {highlighted && (
          <motion.div
            layoutId={`pipeline-drop-${stageId}`}
            className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-primary/10 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}

        {deals.map((deal, i) =>
          interactive ? (
            <DraggableDealCard
              key={deal.id}
              deal={deal}
              index={i}
              onSelect={onDealSelect}
            />
          ) : (
            <DealCard
              key={deal.id}
              deal={deal}
              index={i}
              onClick={onDealSelect ? () => onDealSelect(deal) : undefined}
            />
          )
        )}

        {deals.length === 0 && (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors",
              highlighted
                ? "border-primary/35 bg-primary/5 text-primary/80"
                : "border-white/[0.08] text-muted-foreground/60"
            )}
          >
            <Plus className={cn("size-4", highlighted && "text-primary")} strokeWidth={1.5} />
            <p className="text-xs leading-relaxed">
              {highlighted ? "Solte aqui" : "Arraste negócios para esta etapa"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
