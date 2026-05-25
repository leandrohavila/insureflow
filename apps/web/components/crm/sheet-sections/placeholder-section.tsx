import type { ComponentType, ReactNode } from "react"

import { SectionPanel } from "@/components/crm/primitives"
import { cn } from "@/lib/utils"

type PlaceholderSectionProps = {
  title: string
  description: ReactNode
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  /** Texto de rodapé opcional (ex.: "Em desenvolvimento"). */
  badge?: string
  className?: string
}

/**
 * Empty state estruturado para seções ainda não implementadas (Documentos,
 * Apólices, etc.). Mantém a hierarquia operacional consistente — o consumer
 * vê uma seção real, com título e visual coerente, em vez de espaço vazio.
 */
export function PlaceholderSection({
  title,
  description,
  icon: Icon,
  badge,
  className,
}: PlaceholderSectionProps) {
  return (
    <SectionPanel title={title} tone="default" className={className}>
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center",
        )}
        style={{ borderColor: "var(--crm-stroke-faint)" }}
      >
        <Icon
          className="size-7 text-foreground/40"
          strokeWidth={1.5}
        />
        <p className="crm-text-meta max-w-xs">{description}</p>
        {badge ? (
          <span
            className="crm-text-micro mt-1 rounded-full px-2 py-0.5"
            style={{
              backgroundColor: "color-mix(in oklch, var(--foreground) 4%, transparent)",
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
    </SectionPanel>
  )
}
