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
    <ol className={cn("flex flex-col gap-2", className)}>
      {stages.map((stage) => (
        <li
          key={stage.id}
          className="flex items-start gap-3 rounded-lg border border-[#e4ddd2] bg-white px-3! py-2.5!"
        >
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f6f1e8]">
            <StageIcon status={stage.status} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-[var(--avila-navy-900)]">
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
              <p className="mt-1! text-xs leading-relaxed text-[#5c6578]">
                {stage.status === "BLOCKED" ? `Bloqueio: ${stage.hint}` : stage.hint}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
