"use client"

import type { ComponentType, CSSProperties } from "react"

import { cn } from "@/lib/utils"

export type FilterChipProps = {
  isActive: boolean
  label: string
  count?: number
  icon?: ComponentType<{
    className?: string
    strokeWidth?: number
    style?: CSSProperties
  }>
  /** Variável CSS do accent (ex.: `var(--crm-tone-info)`). */
  accentVar?: string
  onClick: () => void
  className?: string
}

/**
 * Chip de filtro operacional reutilizável (Timeline, Agenda, listas).
 * Usa tokens crm-v2 via `color-mix` — sem cores Tailwind arbitrárias.
 */
export function FilterChip({
  isActive,
  label,
  count,
  icon: Icon,
  accentVar,
  onClick,
  className,
}: FilterChipProps) {
  const accent = accentVar ?? "var(--crm-tone-brand)"

  const activeStyle: CSSProperties = isActive
    ? {
        backgroundColor: `color-mix(in oklch, ${accent} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${accent} 28%, transparent)`,
        color: accent,
      }
    : {
        backgroundColor: "var(--crm-surface-panel)",
        boxShadow: "inset 0 0 0 1px var(--crm-stroke-faint)",
      }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      style={activeStyle}
      className={cn(
        "crm-filter-chip",
        "relative inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium leading-none whitespace-nowrap",
        "transition-[color,background-color,box-shadow] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
        isActive ? null : "text-foreground/72 hover:text-foreground",
        className,
      )}
      data-active={isActive || undefined}
    >
      {Icon ? (
        <Icon
          className={cn(
            "size-3 shrink-0",
            isActive ? "" : "text-foreground/55",
          )}
          strokeWidth={1.75}
          style={isActive ? { color: accent } : undefined}
        />
      ) : null}
      <span>{label}</span>
      {count !== undefined ? (
        <span
          className={cn(
            "tabular-nums",
            isActive ? "" : "text-foreground/45",
          )}
          style={
            isActive
              ? {
                  color: `color-mix(in oklch, ${accent} 75%, transparent)`,
                }
              : undefined
          }
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
