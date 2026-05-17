"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Building2, Clock, GripVertical, MoreHorizontal } from "lucide-react"

import type { CrmDeal } from "@/lib/crm-api"
import { formatCurrency } from "@/lib/crm-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { easeOut } from "@/lib/motion"

const priorityDot = {
  alta: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
  media: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]",
  baixa: "bg-muted-foreground/50",
} as const

type DealCardProps = {
  deal: CrmDeal
  index?: number
  onClick?: () => void
  isDragging?: boolean
  isOverlay?: boolean
}

export function DealCard({
  deal,
  index = 0,
  onClick,
  isDragging,
  isOverlay,
}: DealCardProps) {
  const reduce = useReducedMotion()

  return (
    <motion.article
      layout={!reduce}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: easeOut }}
      whileHover={
        reduce || isDragging || isOverlay
          ? undefined
          : { y: -2, transition: { duration: 0.2 } }
      }
      className={cn(
        "group/deal rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5",
        "shadow-sm transition-[border-color,box-shadow,background,transform] duration-200",
        onClick && !isOverlay && "cursor-pointer",
        isOverlay &&
          "border-primary/35 bg-white/[0.07] shadow-2xl shadow-primary/20 ring-1 ring-primary/30 backdrop-blur-md",
        !isOverlay &&
          !isDragging &&
          "hover:border-primary/25 hover:bg-white/[0.05] hover:shadow-md hover:shadow-primary/5"
      )}
    >
      <motion.div className="mb-3 flex items-start justify-between gap-2">
        <motion.div className="flex min-w-0 items-center gap-2">
          <span
            className={cn("size-2 shrink-0 rounded-full", priorityDot[deal.priority])}
            title={`Prioridade ${deal.priority}`}
          />
          <h4 className="truncate text-[13px] font-semibold tracking-[-0.02em] text-foreground">
            {deal.title}
          </h4>
        </motion.div>
        <div className="flex shrink-0 items-center gap-0.5">
          {!isOverlay && (
            <span
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition-opacity group-hover/deal:opacity-100"
              aria-hidden
            >
              <GripVertical className="size-3.5" strokeWidth={1.5} />
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0 opacity-0 transition-opacity group-hover/deal:opacity-100"
            aria-label="Mais opções"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      </motion.div>

      <motion.div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="size-3.5 shrink-0 opacity-60" strokeWidth={1.5} />
        <span className="truncate">{deal.company}</span>
      </motion.div>

      <p className="tabular-metric mb-3 text-base font-semibold text-foreground">
        {formatCurrency(deal.value)}
      </p>

      <motion.div className="mb-3 flex flex-wrap gap-1">
        <Badge
          variant="outline"
          className="rounded-md border-white/10 bg-white/[0.04] px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
        >
          {deal.product}
        </Badge>
        {deal.tags.slice(0, 1).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="rounded-md border-primary/20 bg-primary/10 px-1.5 py-0 text-[10px] text-primary"
          >
            {tag}
          </Badge>
        ))}
      </motion.div>

      <motion.div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
        <motion.div className="flex items-center gap-2">
          <Avatar className="size-6 border border-white/10">
            <AvatarFallback className="bg-primary/20 text-[9px] font-semibold text-primary">
              {deal.ownerInitials}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[72px] truncate text-[11px] text-muted-foreground">
            {deal.owner}
          </span>
        </motion.div>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
          <Clock className="size-3" strokeWidth={1.5} />
          {deal.lastActivity}
        </span>
      </motion.div>
    </motion.article>
  )
}
