"use client"

import { AlertCircle, CheckCircle2, Circle } from "lucide-react"

import type { CommercialChecklist } from "@/lib/crm/commercial-journey"
import { cn } from "@/lib/utils"

export type CommercialChecklistProps = {
  checklist: CommercialChecklist
  loading?: boolean
  className?: string
}

export function CommercialChecklistPanel({
  checklist,
  loading = false,
  className,
}: CommercialChecklistProps) {
  if (loading) {
    return (
      <p className="crm-text-meta px-1 py-2 text-foreground/55">
        Calculando checklist…
      </p>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="rounded-lg border border-border/60 bg-[var(--crm-surface-panel)] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium tracking-[-0.02em]">Progresso</p>
          <p className="crm-text-metric text-lg font-semibold tabular-nums">
            {checklist.percentComplete}%
          </p>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--crm-stroke-faint)]"
          role="progressbar"
          aria-valuenow={checklist.percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-emerald-600/80"
            style={{ width: `${checklist.percentComplete}%` }}
          />
        </div>
        <p className="crm-text-meta mt-2 text-foreground/60">
          {checklist.requiredCompletedCount}/{checklist.requiredCount} obrigatórios
          · {checklist.completedCount}/{checklist.items.length} itens
        </p>
      </div>

      {checklist.pendingRequired.length > 0 ? (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="crm-text-meta flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
            <AlertCircle className="size-3.5" aria-hidden />
            Pendências obrigatórias
          </p>
          <ul className="mt-1.5 space-y-1">
            {checklist.pendingRequired.map((item) => (
              <li key={item.id} className="crm-text-meta text-foreground/70">
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="space-y-1">
        {checklist.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[12px]"
          >
            {item.completed ? (
              <CheckCircle2
                className="size-3.5 shrink-0 text-emerald-600"
                aria-hidden
              />
            ) : (
              <Circle
                className="size-3.5 shrink-0 text-muted-foreground/45"
                aria-hidden
              />
            )}
            <span
              className={cn(
                item.completed ? "text-foreground/75" : "text-foreground/90",
              )}
            >
              {item.label}
              {item.required ? (
                <span className="ml-1 text-destructive">*</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
