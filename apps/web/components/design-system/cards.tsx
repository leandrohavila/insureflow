import type { ComponentProps, ComponentType, ReactNode } from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

export type AppCardPadding = "none" | "compact" | "default" | "spacious"

export type AppCardProps = ComponentProps<"article"> & {
  padding?: AppCardPadding
  interactive?: boolean
}

const cardPadding = {
  none: "p-0",
  compact: "p-[var(--if-space-4)]",
  default: "p-[var(--if-space-5)]",
  spacious: "p-[var(--if-space-6)]",
} as const

export function AppCard({
  padding = "default",
  interactive = false,
  className,
  ...props
}: AppCardProps) {
  return (
    <article
      className={cn(
        "rounded-[var(--if-radius-2xl)] border border-white/[0.08] bg-card/75 text-card-foreground",
        "transition-[background-color,border-color,box-shadow] duration-[var(--if-duration-base)]",
        cardPadding[padding],
        interactive && "hover:border-primary/25 hover:bg-card",
        className,
      )}
      {...props}
    />
  )
}

export type StatCardTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info"

export type StatCardDensity = "default" | "compact"

export type StatCardProps = ComponentProps<"article"> & {
  label: ReactNode
  value: ReactNode
  description?: ReactNode
  icon?: ComponentType<{ className?: string }>
  tone?: StatCardTone
  density?: StatCardDensity
  loading?: boolean
  error?: ReactNode
}

const statTone = {
  neutral: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
} as const

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "neutral",
  density = "default",
  loading = false,
  error,
  className,
  ...props
}: StatCardProps) {
  if (density === "compact") {
    return (
      <AppCard
        padding="compact"
        aria-busy={loading || undefined}
        title={typeof description === "string" ? description : undefined}
        className={cn(
          "flex min-w-0 w-full items-center justify-between gap-[var(--if-space-2)] py-2",
          className,
        )}
        {...props}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="flex min-h-[var(--if-stat-value-height-compact)] items-center">
            {loading ? (
              <>
                <Loader2
                  className="size-[var(--if-icon-md)] animate-spin text-muted-foreground"
                  aria-hidden
                />
                <span className="sr-only">Carregando indicador</span>
              </>
            ) : (
              <p className="truncate text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {value}
              </p>
            )}
          </div>
        </div>
        {Icon ? (
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-[var(--if-radius-md)] bg-white/[0.04]",
              statTone[tone],
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </span>
        ) : null}
        {description ? (
          <span className="sr-only">{description}</span>
        ) : null}
        {error ? (
          <p className="sr-only text-destructive">{error}</p>
        ) : null}
      </AppCard>
    )
  }

  return (
    <AppCard
      aria-busy={loading || undefined}
        className={cn("flex min-h-[8.25rem] min-w-0 w-full flex-col gap-[var(--if-space-3)]", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-[var(--if-space-3)]">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span className={cn("flex size-[var(--if-icon-lg)] items-center justify-center rounded-[var(--if-radius-md)] bg-white/[0.04]", statTone[tone])}>
            <Icon className="size-[var(--if-icon-md)]" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="flex min-h-[var(--if-stat-value-height)] items-center">
        {loading ? (
          <>
            <Loader2
              className="size-[var(--if-icon-md)] animate-spin text-muted-foreground"
              aria-hidden
            />
            <span className="sr-only">Carregando indicador</span>
          </>
        ) : (
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
        )}
      </div>
      {error ? (
        <p className="text-xs leading-relaxed text-destructive">{error}</p>
      ) : description ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </AppCard>
  )
}
