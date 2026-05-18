"use client"

import type { CrmDeal } from "@/lib/data-access/modules/crm"
import { formatCurrency, pipelineStages } from "@/lib/data-access/modules/crm"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DataTable, type DataTableColumn } from "@/components/shared"

const stageLabel = Object.fromEntries(
  pipelineStages.map((s) => [s.id, s.label]),
) as Record<string, string>

type CrmDealsListProps = {
  onDealSelect?: (deal: CrmDeal) => void
  deals?: CrmDeal[]
}

const columns: DataTableColumn<CrmDeal>[] = [
  {
    key: "deal",
    header: "Negócio",
    headerClassName: "pl-5 md:pl-6",
    className: "pl-5 md:pl-6",
    render: (deal) => (
      <div>
        <p className="font-medium tracking-[-0.02em]">{deal.title}</p>
        <p className="text-xs text-muted-foreground">{deal.company}</p>
      </div>
    ),
  },
  {
    key: "contact",
    header: "Contato",
    hideOnMobile: true,
    className: "text-sm text-muted-foreground",
    render: (deal) => deal.contact,
  },
  {
    key: "stage",
    header: "Estágio",
    render: (deal) => (
      <Badge
        variant="outline"
        className="rounded-full border-primary/30 bg-primary/10 text-[10px] text-primary"
      >
        {stageLabel[deal.stage]}
      </Badge>
    ),
  },
  {
    key: "product",
    header: "Produto",
    hideOnMobile: true,
    className: "text-sm text-muted-foreground",
    render: (deal) => deal.product,
  },
  {
    key: "value",
    header: "Valor",
    className: "text-right font-medium tabular-nums",
    render: (deal) => formatCurrency(deal.value),
  },
  {
    key: "owner",
    header: "Responsável",
    hideOnMobile: true,
    headerClassName: "pr-5 text-right md:pr-6",
    className: "pr-5 md:pr-6",
    render: (deal) => (
      <div className="flex items-center justify-end gap-2">
        <Avatar className="size-7 border border-white/10">
          <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
            {deal.ownerInitials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-xs text-muted-foreground xl:inline">
          {deal.owner}
        </span>
      </div>
    ),
  },
]

export function CrmDealsList({ onDealSelect, deals = [] }: CrmDealsListProps) {
  return (
    <DataTable
      data={deals}
      columns={columns}
      getRowId={(deal) => deal.id}
      onRowClick={onDealSelect}
      emptyTitle="Nenhum negócio encontrado."
      emptyDescription="Ajuste os filtros para visualizar negócios do pipeline."
      cardDelay={0.15}
    />
  )
}
