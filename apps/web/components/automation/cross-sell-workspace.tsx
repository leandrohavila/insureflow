"use client"

import { Button } from "@/components/ui/button"
import { EmptyState, FormSelect, StatCard } from "@/components/design-system"
import {
  CROSS_SELL_STATUS_LABELS,
  CROSS_SELL_STATUSES,
  INTEREST_CATEGORY_LABELS,
  type CrossSellStatus,
  type InterestCategory,
} from "@/lib/business-units/constants"
import {
  useCrossSellMetrics,
  useCrossSellOpportunities,
  useGenerateCrossSell,
  useUpdateCrossSellOpportunity,
} from "@/lib/data-access/modules/automation"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

function categoryLabel(value: string) {
  return INTEREST_CATEGORY_LABELS[value as InterestCategory] ?? value
}

export function CrossSellWorkspace() {
  const { data: metrics } = useCrossSellMetrics()
  const { data = [] } = useCrossSellOpportunities()
  const generate = useGenerateCrossSell()
  const update = useUpdateCrossSellOpportunity()

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Cross-sell gerado"
          value={metrics?.generated ?? 0}
          density="compact"
        />
        <StatCard
          label="Cross-sell convertido"
          value={metrics?.converted ?? 0}
          density="compact"
        />
        <StatCard
          label="Taxa de conversão"
          value={`${metrics?.conversionRate ?? 0}%`}
          density="compact"
        />
        <StatCard
          label="Receita por cross-sell"
          value={formatCurrency(metrics?.revenueFromCrossSell ?? 0)}
          density="compact"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={generate.isPending}
        onClick={() => generate.mutate()}
      >
        Gerar sugestões da base
      </Button>

      <div className="space-y-2">
        {data.length === 0 ? (
          <EmptyState
            title="Nenhum registro encontrado"
            description="Clique em Novo para começar."
            action={
              <Button
                type="button"
                size="sm"
                disabled={generate.isPending}
                onClick={() => generate.mutate()}
              >
                Gerar sugestões da base
              </Button>
            }
          />
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--if-radius-lg)] border border-white/[0.06] px-4 py-3"
            >
              <div>
                <p className="font-medium">{item.customer?.name ?? item.customerId}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabel(item.originCategory)} →{" "}
                  {categoryLabel(item.suggestedCategory)}
                </p>
              </div>
              <FormSelect
                className="w-40"
                value={item.status}
                onChange={(event) =>
                  update.mutate({
                    id: item.id,
                    input: { status: event.target.value as CrossSellStatus },
                  })
                }
                options={CROSS_SELL_STATUSES.map((status) => ({
                  value: status,
                  label: CROSS_SELL_STATUS_LABELS[status],
                }))}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
