"use client"

import { Check, Circle, CircleDashed, Lock } from "lucide-react"

import { StatusPill } from "@/components/crm/primitives"
import type {
  CommercialJourneyStage,
  CommercialStageStatus,
} from "@/lib/crm/commercial-journey"
import { cn } from "@/lib/utils"

const STATUS_TONE: Record<
  CommercialStageStatus,
  "neutral" | "info" | "success" | "warn"
> = {
  NOT_STARTED: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  BLOCKED: "warn",
}

const STATUS_LABEL: Record<CommercialStageStatus, string> = {
  NOT_STARTED: "Não iniciado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  BLOCKED: "Bloqueado",
}

function StageIcon({ status }: { status: CommercialStageStatus }) {
  if (status === "COMPLETED") {
    return <Check className="size-3.5 text-emerald-600" aria-hidden />
  }
  if (status === "BLOCKED") {
    return <Lock className="size-3.5 text-amber-600" aria-hidden />
  }
  if (status === "IN_PROGRESS") {
    return <CircleDashed className="size-3.5 text-primary" aria-hidden />
  }
  return <Circle className="size-3.5 text-muted-foreground/50" aria-hidden />
}

export type CommercialJourneyProps = {
  stages: CommercialJourneyStage[]
  loading?: boolean
  className?: string
}

export function CommercialJourney({
  stages,
  loading = false,
  className,
}: CommercialJourneyProps) {
  if (loading) {
    return (
      <p className="crm-text-meta px-1 py-2 text-foreground/55">
        Calculando jornada comercial…
      </p>
    )
  }

  return (
    <ol className={cn("flex flex-col gap-1", className)}>
      {stages.map((stage, index) => (
        <li
          key={stage.id}
          className="relative flex items-start gap-2 rounded-md px-1.5 py-1.5"
        >
          {index < stages.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[13px] top-[26px] h-[calc(100%-4px)] w-px bg-[var(--crm-stroke-faint)]"
            />
          ) : null}
          <span className="relative z-[1] mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--crm-surface-panel)]">
            <StageIcon status={stage.status} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-[12px] font-medium tracking-[-0.01em] text-foreground">
                {stage.label}
              </p>
              <StatusPill
                tone={STATUS_TONE[stage.status]}
                variant="soft"
                size="xs"
              >
                {STATUS_LABEL[stage.status]}
              </StatusPill>
            </div>
            {stage.hint ? (
              <p className="crm-text-meta mt-0.5 text-foreground/55">
                {stage.hint}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
