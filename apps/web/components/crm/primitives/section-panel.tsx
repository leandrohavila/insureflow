import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

export type SectionPanelTone = "default" | "panel" | "raised" | "transparent"

// `HTMLAttributes<HTMLElement>` declara `title?: string` (atributo HTML, usado
// como tooltip). Aqui queremos `title` como `ReactNode` para suportar JSX,
// então removemos a colisão via `Omit` antes da intersecção.
type SectionPanelProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title?: ReactNode
  description?: ReactNode
  /** Slot para ações no canto direito do header (links, botões discretos). */
  action?: ReactNode
  /** Slot opcional acima do título para chips/badges contextuais. */
  eyebrow?: ReactNode
  /** Borda hairline ao redor do panel (off por padrão — agrupamento via whitespace). */
  bordered?: boolean
  /** Divisor finíssimo entre header e body. */
  dividedHeader?: boolean
  tone?: SectionPanelTone
  density?: "default" | "compact"
}

/**
 * Container neutro de agrupamento operacional.
 *
 * Substitui o uso genérico de `GlassCard` quando o objetivo é apenas agrupar
 * conteúdo (lista, formulário, propriedades). Não usa borda nem sombra por
 * padrão — separação por whitespace + surface ladder.
 */
export function SectionPanel({
  title,
  description,
  action,
  eyebrow,
  bordered = false,
  dividedHeader = false,
  tone = "default",
  density = "default",
  className,
  children,
  ...rest
}: SectionPanelProps) {
  const isCompact = density === "compact"
  const hasHeader = Boolean(title || description || action || eyebrow)

  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-lg",
        tone === "default" && "bg-transparent",
        tone === "panel" && "crm-surface-panel",
        tone === "raised" && "crm-surface-raised shadow-if-sm",
        tone === "transparent" && "bg-transparent",
        bordered && "border crm-stroke-faint",
        className,
      )}
      {...rest}
    >
      {hasHeader ? (
        <header
          className={cn(
            "flex items-start justify-between gap-3",
            isCompact ? "px-3 pt-2.5" : "px-3.5 pt-3 md:px-4",
            dividedHeader ? "pb-2.5" : "pb-2",
            dividedHeader && "border-b crm-stroke-faint",
          )}
        >
          <div className="min-w-0 flex-1 space-y-0.5">
            {eyebrow ? (
              <div className="crm-text-micro tracking-wide">{eyebrow}</div>
            ) : null}
            {title ? (
              <h3 className="crm-text-title text-foreground">{title}</h3>
            ) : null}
            {description ? (
              <p className="crm-text-meta">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div
        className={cn(
          "min-w-0 flex-1",
          hasHeader && (isCompact ? "px-1.5 pb-2.5 pt-1" : "px-2 pb-3 pt-1.5"),
          !hasHeader && (isCompact ? "p-2" : "p-2.5"),
        )}
      >
        {children}
      </div>
    </section>
  )
}
