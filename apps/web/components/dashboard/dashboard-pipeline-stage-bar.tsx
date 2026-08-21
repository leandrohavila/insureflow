"use client"

import { pipelineStages } from "@/lib/data-access/modules/crm"
import { cn } from "@/lib/utils"

import type { PipelineStageMetric } from "./dashboard-pipeline-metrics"

const stageBarColor: Record<(typeof pipelineStages)[number]["id"], string> = {
  novo: "bg-sky-500",
  contato: "bg-violet-500",
  cotacao: "bg-primary",
  qualificacao: "bg-violet-500",
  visita: "bg-violet-500",
  proposta: "bg-primary",
  negociacao: "bg-amber-500",
  contrato: "bg-amber-500",
  fechamento: "bg-emerald-500",
  fechado: "bg-emerald-500",
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
          className="flex w-full gap-1 rounded-md border border-border/40 bg-muted/20 p-0.5"
          role="img"
          aria-label={`Distribuição do pipeline: ${stages.map((s) => `${s.label} ${s.count}`).join(", ")}`}
        >
          {stages.map((stage) => {
            const share = stage.count / total
            if (share <= 0) return null

            return (
              <div
                key={stage.id}
                className="min-w-[3px] flex-1"
                style={{ flexGrow: share, flexBasis: 0 }}
              >
                <div
                  className={cn(
                    "h-3 rounded-[3px] border border-white/10 shadow-sm transition-[filter] duration-[var(--if-duration-base)] hover:brightness-110",
                    stageBarColor[stage.id],
                  )}
                  title={`${stage.label}: ${stage.count} (${stage.share}%)`}
                />
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-5 gap-0.5">
        {stages.map((stage) => (
          <div key={stage.id} className="min-w-0 px-0.5 text-center">
            <p className="truncate text-[0.625rem] font-medium text-muted-foreground">
              {stage.label}
            </p>
            {!loading ? (
              <>
                <p className="text-xs font-semibold tabular-nums text-foreground">
                  {stage.count}
                </p>
                <p className="text-[0.625rem] tabular-nums text-muted-foreground/80">
                  {total > 0 ? `${stage.share}%` : "—"}
                </p>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
