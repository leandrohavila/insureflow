"use client"

import { memo } from "react"
import { Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

export type AutoSaveStatus = "idle" | "pending" | "saving" | "saved"

type AutoSaveIndicatorProps = {
  status: AutoSaveStatus
  className?: string
}

const statusConfig: Record<
  AutoSaveStatus,
  { label: string; dotClass: string; showSpinner?: boolean }
> = {
  idle: {
    label: "Sem alterações",
    dotClass: "bg-muted-foreground/40",
  },
  pending: {
    label: "Alterações pendentes",
    dotClass: "bg-amber-400 animate-pulse",
  },
  saving: {
    label: "Salvando...",
    dotClass: "bg-primary",
    showSpinner: true,
  },
  saved: {
    label: "Salvo agora",
    dotClass: "bg-emerald-400",
  },
}

export const AutoSaveIndicator = memo(function AutoSaveIndicator({
  status,
  className,
}: AutoSaveIndicatorProps) {
  const config = statusConfig[status]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={config.label}
    >
      {config.showSpinner ? (
        <Loader2 className="size-3 animate-spin text-primary" aria-hidden />
      ) : status === "saved" ? (
        <Check className="size-3 text-emerald-400" aria-hidden />
      ) : (
        <span
          className={cn("size-2 rounded-full", config.dotClass)}
          aria-hidden
        />
      )}
      <span>{config.label}</span>
    </div>
  )
})
