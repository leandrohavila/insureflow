import type { ComponentType, HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

export type MetricStripTone =
  | "neutral"
  | "brand"
  | "info"
  | "success"
  | "warn"
  | "danger"

const TONE_VALUE: Record<MetricStripTone, string> = {
  neutral: "text-foreground",
  brand: "text-primary",
  info: "text-sky-300",
  success: "text-emerald-300",
  warn: "text-amber-200",
  danger: "text-rose-300",
}

type MetricStripProps = HTMLAttributes<HTMLDivElement> & {
  density?: "default" | "compact"
}

/**
 * Faixa horizontal compacta de métricas operacionais.
 *
 * Substitui o uso de `CrmMetrics` (4 cards grandes) quando o contexto não
 * pede destaque hero (ex.: dentro de Negócios). Cada item é apresentado
 * inline com separadores hairline verticais entre eles.
 */
export function MetricStrip({
  density = "default",
  className,
  children,
  ...rest
}: MetricStripProps) {
  return (
    <div
      role="list"
      className={cn(
        "crm-surface-panel flex min-w-0 items-stretch rounded-lg border",
        "crm-stroke-faint",
        "divide-x crm-stroke-faint",
        density === "compact" ? "h-10" : "h-12",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

type MetricStripItemProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: MetricStripTone
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>
}

function MetricStripItem({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
  className,
  ...rest
}: MetricStripItemProps) {
  return (
    <div
      role="listitem"
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2.5 px-3 md:px-4",
        className,
      )}
      {...rest}
    >
      {Icon ? (
        <Icon
          className="size-3.5 shrink-0 text-foreground/45"
          strokeWidth={1.5}
        />
      ) : null}
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="crm-text-micro tracking-wide truncate">{label}</span>
        <span
          className={cn(
            "crm-text-metric truncate text-[13px] font-semibold",
            TONE_VALUE[tone],
          )}
        >
          {value}
        </span>
      </div>
      {hint ? (
        <span className="crm-text-meta ml-auto hidden truncate xl:inline">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

MetricStrip.Item = MetricStripItem
