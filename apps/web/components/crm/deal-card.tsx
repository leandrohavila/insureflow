"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { AlarmClock, AlertTriangle, Building2, GripVertical } from "lucide-react"
import type { CSSProperties } from "react"

import { DealCardMenu } from "@/components/crm/deal-card-menu"
import { DealQuestionnaireBadge } from "@/components/crm/deal-questionnaire-badge"
import { DealQuickContext } from "@/components/crm/deal-quick-context"
import { StatusPill } from "@/components/crm/primitives"
import { businessUnitPipelineBadge } from "@/lib/crm/business-unit-badge"
import {
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STAGE_TONE,
} from "@/components/crm/sheet-sections/deal-shared"
import { getDealCardSignals } from "@/lib/crm/deal-card-signals"
import { resolvePipelineDensity } from "@/lib/crm/pipeline-density"
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
  /** Compacto esconde campos e reduz altura. Ausente = confortável. */
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
  const density = resolvePipelineDensity(compact ? "compact" : "comfortable")
  const show = (field: (typeof density.visibleFields)[number]) =>
    density.visibleFields.includes(field)

  const cardStyle = {
    ["--crm-accent-color" as string]: signals.accentVar,
    ["--crm-priority-accent" as string]: signals.priorityAccentVar,
    minHeight: density.cardMinHeightPx,
    gap: density.cardGapPx,
    padding: density.cardPadding,
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
      data-density={density.dataDensity}
      data-status={deal.status}
      className={cn(
        "deal-card-v2 crm-accent-rail group/deal w-full min-w-0",
        density.cardClassName,
        onClick && !isOverlay && "cursor-pointer",
        isOverlay && "deal-card-v2--overlay",
        isDragging && "deal-card-v2--dragging",
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
          {show("company") ? (
            <p className="deal-card-v2__company">
              <Building2 className="size-3 shrink-0 opacity-50" strokeWidth={1.5} />
              <span className="truncate">{deal.company}</span>
            </p>
          ) : null}
          {show("contact") && deal.contact ? (
            <p className="deal-card-v2__contact truncate">{deal.contact}</p>
          ) : null}
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
          <span className="deal-card-v2__owner">
            <Avatar className={show("ownerName") ? "size-6" : "size-5"}>
              <AvatarFallback className="bg-primary/15 text-[8px] text-primary">
                {deal.ownerInitials}
              </AvatarFallback>
            </Avatar>
            {show("ownerName") ? (
              <span className="crm-text-micro max-w-[8rem] truncate">
                {deal.owner}
              </span>
            ) : null}
          </span>
          {show("interaction") ? (
            <span
              className={cn(
                "deal-card-v2__interaction crm-text-micro tabular-nums",
                signals.isStale && "deal-card-v2__interaction--stale",
              )}
              title={signals.interactionLabel}
            >
              {signals.interactionLabel}
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Rodapé: badges + indicadores ── */}
      <div className="deal-card-v2__foot">
        <div className="deal-card-v2__badges">
          <StatusPill
            tone={
              deal.sla?.status === "overdue"
                ? "danger"
                : deal.sla?.status === "warning"
                  ? "warn"
                  : deal.businessUnit?.type === "REAL_ESTATE"
                    ? "violet"
                    : "info"
            }
            variant="ghost"
            size="xs"
          >
            {businessUnitPipelineBadge(deal.businessUnit?.type)}
          </StatusPill>
          {show("score") && deal.score ? (
            <StatusPill
              tone={
                deal.score === "HIGH"
                  ? "danger"
                  : deal.score === "MEDIUM"
                    ? "warn"
                    : "neutral"
              }
              variant="ghost"
              size="xs"
            >
              {deal.score}
            </StatusPill>
          ) : null}
          {show("stage") ? (
            <StatusPill tone={STAGE_TONE[deal.stage]} variant="ghost" size="xs">
              {stageLabelMap[deal.stage]}
            </StatusPill>
          ) : null}
          {show("priority") && deal.priority !== "baixa" ? (
            <StatusPill
              tone={PRIORITY_TONE[deal.priority]}
              variant="ghost"
              size="xs"
              dot
            >
              {PRIORITY_LABEL[deal.priority]}
            </StatusPill>
          ) : null}
          {show("questionnaire") ? (
            <DealQuestionnaireBadge
              deal={deal}
              className="h-5 rounded-md px-1.5 text-[10px]"
            />
          ) : null}
          {show("product") && deal.product ? (
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
