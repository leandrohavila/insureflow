"use client"

import { SectionPanel } from "@/components/crm/primitives"
import { CommercialChecklistPanel } from "@/components/crm/commercial-intelligence/commercial-checklist"
import { CommercialJourney } from "@/components/crm/commercial-intelligence/commercial-journey"
import { CommercialRecommendations } from "@/components/crm/commercial-intelligence/commercial-recommendations"
import { CommercialScoreCard } from "@/components/crm/commercial-intelligence/commercial-score-card"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import { useCommercialIntelligence } from "@/lib/data-access/modules/commercial-intelligence"
import { getErrorMessage } from "@/lib/data-access"
import { cn } from "@/lib/utils"

export type CommercialIntelligencePanelProps = {
  deal: CrmDeal
  className?: string
}

export function CommercialIntelligencePanel({
  deal,
  className,
}: CommercialIntelligencePanelProps) {
  const { snapshot, isLoading, error } = useCommercialIntelligence(deal)

  return (
    <aside
      className={cn(
        "commercial-intelligence-panel shrink-0",
        "border-t border-[var(--crm-stroke-faint)] pt-4",
        "xl:w-[300px] xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0",
        className,
      )}
      aria-label="Commercial Journey"
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p className="crm-text-meta rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
            {getErrorMessage(error, "Não foi possível carregar a inteligência comercial.")}
          </p>
        ) : null}

        <SectionPanel title="Commercial Journey" tone="default" density="compact">
          <CommercialJourney
            stages={snapshot?.journey ?? []}
            loading={isLoading}
          />
        </SectionPanel>

        <SectionPanel title="Commercial Score" tone="default" density="compact">
          {snapshot ? (
            <CommercialScoreCard score={snapshot.score} loading={isLoading} />
          ) : (
            <CommercialScoreCard
              score={{
                value: 0,
                tier: "low",
                tierLabel: "Baixo",
                criteria: [],
              }}
              loading={isLoading}
            />
          )}
        </SectionPanel>

        <SectionPanel title="Checklist Comercial" tone="default" density="compact">
          {snapshot ? (
            <CommercialChecklistPanel
              checklist={snapshot.checklist}
              loading={isLoading}
            />
          ) : null}
        </SectionPanel>

        <SectionPanel title="Recomendações" tone="default" density="compact">
          <CommercialRecommendations
            recommendations={snapshot?.recommendations ?? []}
            loading={isLoading}
          />
        </SectionPanel>
      </div>
    </aside>
  )
}
