"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { AlarmClock, AlertTriangle, Building2, GripVertical } from "lucide-react"
import type { CSSProperties } from "react"

import { DealCardMenu } from "@/components/crm/deal-card-menu"
import { DealQuestionnaireBadge } from "@/components/crm/deal-questionnaire-badge"
import { DealQuickContext } from "@/components/crm/deal-quick-context"
import { StatusPill } from "@/components/crm/primitives"
import {
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STAGE_TONE,
} from "@/components/crm/sheet-sections/deal-shared"
import { getDealCardSignals } from "@/lib/crm/deal-card-signals"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import { formatCurrency, stageLabelMap } from "@/lib/data-access/modules/crm"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { easeOut } from "@/lib/motion"

type DealCardProps = {
  deal: CrmDeal
  index?: number
  onClick?: () => void
  onEdit?: (deal: CrmDeal) => void
  onDelete?: (deal: CrmDeal) => void
  isDragging?: boolean
  isOverlay?: boolean
  canDrag?: boolean
  /** Densidade reduzida para overview / futuro modo compacto. */
  compact?: boolean
}

export function DealCard({
  deal,
  index = 0,
  onClick,
  onEdit,
  onDelete,
  isDragging,
  isOverlay,
  canDrag,
  compact = false,
}: DealCardProps) {
  const reduce = useReducedMotion()

  const signals = useMemo(() => getDealCardSignals(deal), [deal])

  const cardStyle = {
    ["--crm-accent-color" as string]: signals.accentVar,
    ["--crm-priority-accent" as string]: signals.priorityAccentVar,
  } as CSSProperties

  const card = (
    <motion.article
      layout={!reduce && !isDragging && !isOverlay}
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
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: easeOut }}
      whileHover={
        reduce || isDragging || isOverlay
          ? undefined
          : { y: -3, transition: { duration: 0.18 } }
      }
      style={cardStyle}
      data-priority={deal.priority}
      data-stale={signals.isStale || undefined}
      data-density={compact ? "compact" : "default"}
      data-status={deal.status}
      className={cn(
        "deal-card-v2 crm-accent-rail group/deal min-w-0 max-w-full",
        onClick && !isOverlay && "cursor-pointer",
        isOverlay && "deal-card-v2--overlay",
        isDragging && "deal-card-v2--dragging",
        compact && "deal-card-v2--compact",
      )}
    >
      {deal.priority !== "baixa" ? (
        <span
          className="deal-card-v2__priority-mark"
          aria-hidden
          title={`Prioridade ${PRIORITY_LABEL[deal.priority]}`}
        />
      ) : null}

      {/* ── Topo: identidade ── */}
      <div className="deal-card-v2__head">
        <div className="min-w-0 flex-1">
          <h4 className="deal-card-v2__title">{deal.title}</h4>
          <p className="deal-card-v2__company">
            <Building2 className="size-3 shrink-0 opacity-50" strokeWidth={1.5} />
            <span className="truncate">{deal.company}</span>
          </p>
        </div>

        <div className="deal-card-v2__chrome">
          {!isOverlay && canDrag ? (
            <span
              className="deal-card-v2__grip pointer-events-none"
              aria-hidden
            >
              <GripVertical className="size-3.5" strokeWidth={1.5} />
            </span>
          ) : null}
          {!isOverlay ? (
            <DealCardMenu
              deal={deal}
              onOpen={onClick}
              onEdit={onEdit}
              onDelete={onDelete}
              disabled={isDragging}
            />
          ) : null}
        </div>
      </div>

      {/* ── Meio: valor + operador ── */}
      <div className="deal-card-v2__body">
        <p className="deal-card-v2__value crm-text-metric">
          {formatCurrency(deal.value)}
        </p>
        <div className="deal-card-v2__meta">
          {!compact ? (
            <span className="deal-card-v2__owner">
              <Avatar className="size-5">
                <AvatarFallback className="bg-primary/15 text-[8px] text-primary">
                  {deal.ownerInitials}
                </AvatarFallback>
              </Avatar>
              <span className="crm-text-micro max-w-[5.5rem] truncate">
                {deal.owner}
              </span>
            </span>
          ) : (
            <Avatar className="size-5">
              <AvatarFallback className="bg-primary/15 text-[8px] text-primary">
                {deal.ownerInitials}
              </AvatarFallback>
            </Avatar>
          )}
          <span
            className={cn(
              "deal-card-v2__interaction crm-text-micro tabular-nums",
              signals.isStale && "deal-card-v2__interaction--stale",
            )}
            title={signals.interactionLabel}
          >
            {signals.interactionLabel}
          </span>
        </div>
      </div>

      {/* ── Rodapé: badges + indicadores ── */}
      <div className="deal-card-v2__foot">
        <div className="deal-card-v2__badges">
          <StatusPill tone={STAGE_TONE[deal.stage]} variant="ghost" size="xs">
            {stageLabelMap[deal.stage]}
          </StatusPill>
          {deal.priority !== "baixa" ? (
            <StatusPill
              tone={PRIORITY_TONE[deal.priority]}
              variant="ghost"
              size="xs"
              dot
            >
              {PRIORITY_LABEL[deal.priority]}
            </StatusPill>
          ) : null}
          <DealQuestionnaireBadge
            deal={deal}
            className="h-5 rounded-md px-1.5 text-[10px]"
          />
          {!compact && deal.product ? (
            <span className="deal-card-v2__chip">{deal.product}</span>
          ) : null}
        </div>

        <div className="deal-card-v2__indicators">
          {signals.signals.includes("stale-interaction") ? (
            <span
              className="deal-card-v2__indicator deal-card-v2__indicator--warn"
              title="Sem interação recente"
            >
              <AlarmClock className="size-3" strokeWidth={1.5} />
            </span>
          ) : null}
          {signals.signals.includes("no-interaction") ? (
            <span
              className="deal-card-v2__indicator deal-card-v2__indicator--danger"
              title="Sem interação registrada"
            >
              <AlertTriangle className="size-3" strokeWidth={1.5} />
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  )

  if (isOverlay) return card

  return (
    <DealQuickContext deal={deal} disabled={isDragging}>
      {card}
    </DealQuickContext>
  )
}
