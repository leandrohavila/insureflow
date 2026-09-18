"use client"

import type { ReactNode } from "react"
import { AlertTriangle, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type CommercialWarningTone = "warning" | "info"

export type CommercialWarningAction = {
  label: string
  onClick: () => void
  variant?: "default" | "outline" | "ghost"
}

export type CommercialWarningBannerProps = {
  tone?: CommercialWarningTone
  title: string
  description?: ReactNode
  meta?: ReactNode
  primaryAction?: CommercialWarningAction
  secondaryAction?: CommercialWarningAction
  onDismiss?: () => void
  className?: string
}

const toneStyles: Record<CommercialWarningTone, string> = {
  warning:
    "border-amber-400/35 bg-amber-500/10 text-amber-100 [&_p]:text-amber-100/90",
  info: "border-sky-400/30 bg-sky-500/10 text-sky-100 [&_p]:text-sky-100/90",
}

export function CommercialWarningBanner({
  tone = "warning",
  title,
  description,
  meta,
  primaryAction,
  secondaryAction,
  onDismiss,
  className,
}: CommercialWarningBannerProps) {
  const Icon = tone === "warning" ? AlertTriangle : Info

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        toneStyles[tone],
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Icon className="mt-0.5 size-4 shrink-0 opacity-90" aria-hidden />
          <div className="space-y-1">
            <p className="font-medium leading-snug">{title}</p>
            {description ? (
              <div className="text-xs leading-relaxed opacity-90">{description}</div>
            ) : null}
            {meta ? <div className="pt-1 text-xs opacity-80">{meta}</div> : null}
          </div>
        </div>

        {(primaryAction || secondaryAction || onDismiss) && (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {primaryAction ? (
              <Button
                type="button"
                size="sm"
                variant={primaryAction.variant ?? "default"}
                className="h-8"
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </Button>
            ) : null}
            {secondaryAction ? (
              <Button
                type="button"
                size="sm"
                variant={secondaryAction.variant ?? "outline"}
                className="h-8 border-current/25 bg-transparent hover:bg-white/5"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            ) : null}
            {onDismiss ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 hover:bg-white/5"
                onClick={onDismiss}
              >
                Dispensar
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
