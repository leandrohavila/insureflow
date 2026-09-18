import { Activity, Clock } from "lucide-react"

import { cn } from "@/lib/utils"

type TimelineEmptyStateProps = {
  className?: string
  /** Quando true, indica filtro ativo sem resultados (não é histórico vazio). */
  filtered?: boolean
  filterLabel?: string
}

/**
 * Empty state operacional premium — evita caixa genérica.
 * Não dispara mutations; orienta o operador para as ações rápidas do header.
 */
export function TimelineEmptyState({
  className,
  filtered = false,
  filterLabel,
}: TimelineEmptyStateProps) {
  if (filtered && filterLabel) {
    return (
      <div
        role="status"
        className={cn(
          "timeline-empty-state timeline-empty-state--filtered",
          className,
        )}
      >
        <Activity className="timeline-empty-state__icon" strokeWidth={1.25} />
        <div className="timeline-empty-state__copy">
          <p className="timeline-empty-state__title">
            Nenhum registro de {filterLabel.toLowerCase()}
          </p>
          <p className="timeline-empty-state__hint crm-text-meta">
            Ajuste o filtro ou limpe a seleção para ver o histórico completo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div role="status" className={cn("timeline-empty-state", className)}>
      <div className="timeline-empty-state__visual" aria-hidden>
        <span className="timeline-empty-state__rail" />
        <span className="timeline-empty-state__node">
          <Clock className="size-4" strokeWidth={1.5} />
        </span>
      </div>
      <div className="timeline-empty-state__copy">
        <p className="timeline-empty-state__title">Histórico operacional vazio</p>
        <p className="timeline-empty-state__hint crm-text-meta">
          Registre ligações, mensagens e follow-ups pelas ações rápidas acima.
          Cada interação alimenta o contexto comercial deste registro.
        </p>
      </div>
    </div>
  )
}
