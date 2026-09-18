"use client"

import { Lightbulb } from "lucide-react"

import type { CommercialRecommendation } from "@/lib/crm/commercial-journey"
import { cn } from "@/lib/utils"

const PRIORITY_CLASS: Record<
  CommercialRecommendation["priority"],
  string
> = {
  high: "border-destructive/20 bg-destructive/5",
  medium: "border-primary/20 bg-primary/5",
  low: "border-border/60 bg-[var(--crm-surface-panel)]",
}

export type CommercialRecommendationsProps = {
  recommendations: CommercialRecommendation[]
  loading?: boolean
  className?: string
}

export function CommercialRecommendations({
  recommendations,
  loading = false,
  className,
}: CommercialRecommendationsProps) {
  if (loading) {
    return (
      <p className="crm-text-meta px-1 py-2 text-foreground/55">
        Gerando recomendações…
      </p>
    )
  }

  if (recommendations.length === 0) {
    return (
      <p className="crm-text-meta rounded-md border border-dashed px-3 py-4 text-center text-foreground/60">
        Nenhuma recomendação pendente. Jornada em bom progresso.
      </p>
    )
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {recommendations.map((item) => (
        <li
          key={item.id}
          className={cn(
            "rounded-md border px-3 py-2.5",
            PRIORITY_CLASS[item.priority],
          )}
        >
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-foreground/85">
            <Lightbulb
              className="mt-0.5 size-3.5 shrink-0 text-primary"
              aria-hidden
            />
            {item.message}
          </p>
        </li>
      ))}
    </ul>
  )
}
