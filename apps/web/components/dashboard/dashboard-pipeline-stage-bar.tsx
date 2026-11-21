"use client"

import { pipelineStages } from "@/lib/data-access/modules/crm"
import { cn } from "@/lib/utils"

import type { PipelineStageMetric } from "./dashboard-pipeline-metrics"

const stageBarColor: Record<(typeof pipelineStages)[number]["id"], string> = {
  novo: "bg-[#10294B]",
  contato: "bg-[#3d5f86]",
  qualificacao: "bg-[#3d5f86]",
  "primeiro-contato": "bg-[#3d5f86]",
  visita: "bg-[#6d88a8]",
  "visita-agendada": "bg-[#6d88a8]",
  cotacao: "bg-[#C09048]",
  proposta: "bg-[#9a7040]",
  negociacao: "bg-[#9a7040]",
  contrato: "bg-[#9a7040]",
  fechamento: "bg-[#157a3c]",
  fechado: "bg-[#157a3c]",
  perdido: "bg-[#c4bbae]",
}

type DashboardPipelineStageBarProps = {
  stages: PipelineStageMetric[]
  loading?: boolean
  className?: string
}

export function DashboardPipelineStageBar({
  stages,
  loading = false,
  className,
}: DashboardPipelineStageBarProps) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
        Distribuição do Pipeline
      </p>

      {loading ? (
        <div className="h-3.5 w-full animate-pulse rounded-md bg-muted/50" />
      ) : total === 0 ? (
        <div className="h-3.5 w-full rounded-md border border-border/50 bg-muted/30" />
      ) : (
        <div
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#ebe5dc]"
          role="img"
          aria-label={`Distribuição do pipeline: ${stages.map((s) => `${s.label} ${s.count} ${s.share}%`).join(", ")}`}
        >
          {stages.map((stage) => {
            const share = stage.count / total
            if (share <= 0) return null

            return (
              <div
                key={stage.id}
                className={cn("h-full shrink-0", stageBarColor[stage.id])}
                style={{ width: `${share * 100}%` }}
                title={`${stage.label}: ${stage.count} (${stage.share}%)`}
              />
            )
          })}
        </div>
      )}

      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {stages.map((stage) => (
          <li key={stage.id} className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-full", stageBarColor[stage.id])}
            />
            <span className="min-w-0 flex-1 truncate text-xs text-foreground">
              {stage.label}
            </span>
            {!loading ? (
              <>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {stage.count}
                </span>
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                  {total > 0 ? `${stage.share}%` : "—"}
                </span>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
