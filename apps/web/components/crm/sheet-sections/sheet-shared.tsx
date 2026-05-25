import type { ComponentType, ReactNode } from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/* PropertyCell — par label/value para grids de propriedades                  */
/* -------------------------------------------------------------------------- */

type PropertyCellProps = {
  label: ReactNode
  value: ReactNode
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>
  /** Cell ocupa as 2 colunas do grid (md+). */
  span?: 1 | 2
  className?: string
}

/**
 * Célula de propriedade operacional (label pequena em cima, valor em baixo).
 *
 * Primitive compartilhado entre todos os workspaces de entidade (Deal, Lead,
 * futuros Customer/Policy). Pareado com o pattern Linear/Attio/HubSpot. Use
 * dentro de `PropertyGrid` para obter hairlines elegantes via `gap-px`
 * + background `--crm-stroke-faint`, sem bordas duplicadas.
 */
export function PropertyCell({
  label,
  value,
  icon: Icon,
  span = 1,
  className,
}: PropertyCellProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 px-3.5 py-2.5",
        span === 2 && "md:col-span-2",
        className,
      )}
    >
      <span className="crm-text-micro tracking-wide">{label}</span>
      <span className="crm-text-meta flex min-w-0 items-center gap-1.5 text-foreground/85">
        {Icon ? (
          <Icon
            className="size-3.5 shrink-0 opacity-60"
            strokeWidth={1.5}
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{value}</span>
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* PropertyGrid — wrapper de grid com hairlines via gap-px                     */
/* -------------------------------------------------------------------------- */

type PropertyGridProps = {
  children: ReactNode
  className?: string
  /** Número de colunas em desktop. Default: 2. */
  cols?: 1 | 2
}

/**
 * Grid de `PropertyCell` com hairlines elegantes via `gap-px` + background
 * `--crm-stroke-faint`. Cada cell deve usar `bg-[var(--crm-surface-panel)]`
 * via className na cell (o caller é quem decide).
 */
export function PropertyGrid({
  children,
  className,
  cols = 2,
}: PropertyGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-lg border",
        cols === 2 && "md:grid-cols-2",
        className,
      )}
      style={{
        backgroundColor: "var(--crm-stroke-faint)",
        borderColor: "var(--crm-stroke-faint)",
      }}
    >
      {children}
    </div>
  )
}
