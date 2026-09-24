"use client"

import { Edit3, Trash2 } from "lucide-react"

import { DealQuestionnaireBadge } from "@/components/crm/deal-questionnaire-badge"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import { formatCurrency, stageLabelMap } from "@/lib/data-access/modules/crm"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DataTable, type DataTableColumn } from "@/components/design-system"

const stageLabel = stageLabelMap

type CrmDealsListProps = {
  onDealSelect?: (deal: CrmDeal) => void
  onDealEdit?: (deal: CrmDeal) => void
  onDealDelete?: (deal: CrmDeal) => void
  deletePending?: boolean
  deals?: CrmDeal[]
  stickyHeader?: boolean
  /** Compacto esconde colunas secundárias e reduz a altura da linha. */
  density?: "compact" | "default"
}

function buildColumns(
  density: "compact" | "default",
): DataTableColumn<CrmDeal>[] {
  const comfortable = density === "default"
  const columns: DataTableColumn<CrmDeal>[] = [
    {
      key: "deal",
      header: "Negócio",
      headerClassName: "pl-5 md:pl-6",
      className: "pl-5 md:pl-6",
      render: (deal) => (
        <div className={comfortable ? "py-0.5" : undefined}>
          <p className={comfortable ? "text-base font-semibold tracking-tight" : "text-sm font-semibold tracking-tight"}>
            {deal.title}
          </p>
          {comfortable ? (
            <p className="text-sm text-foreground/60">{deal.company}</p>
          ) : null}
        </div>
      ),
    },
  ]

  if (comfortable) {
    columns.push(
      {
        key: "contact",
        header: "Contato",
        hideOnMobile: true,
        className: "text-sm text-foreground/65",
        render: (deal) => deal.contact,
      },
      {
        key: "questionnaire",
        header: "Questionário",
        hideOnMobile: true,
        render: (deal) => <DealQuestionnaireBadge deal={deal} />,
      },
    )
  }

  columns.push({
    key: "stage",
    header: "Estágio",
    render: (deal) => (
      <Badge
        variant="outline"
        className="rounded-full border-primary/35 bg-primary/12 text-xs font-medium text-primary"
      >
        {stageLabel[deal.stage]}
      </Badge>
    ),
  })

  if (comfortable) {
    columns.push({
      key: "product",
      header: "Produto",
      hideOnMobile: true,
      className: "text-sm text-foreground/65",
      render: (deal) => deal.product,
    })
  }

  columns.push(
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
          <Avatar className={comfortable ? "size-8 border border-white/10" : "size-6 border border-white/10"}>
            <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
              {deal.ownerInitials}
            </AvatarFallback>
          </Avatar>
          {comfortable ? (
            <span className="text-xs text-muted-foreground">{deal.owner}</span>
          ) : null}
        </div>
      ),
    },
  )

  return columns
}

export function CrmDealsList({
  onDealSelect,
  onDealEdit,
  onDealDelete,
  deletePending,
  deals = [],
  stickyHeader = false,
  density = "compact",
}: CrmDealsListProps) {
  const columns = buildColumns(density)
  return (
    <DataTable
      className="w-full"
      data={deals}
      columns={columns}
      getRowId={(deal) => deal.id}
      onRowClick={onDealSelect}
      stickyHeader={stickyHeader}
      rowActions={[
        {
          key: "edit",
          label: "Editar negócio",
          icon: Edit3,
          permission: "crm:manage",
          hidden: !onDealEdit,
          onSelect: (deal) => onDealEdit?.(deal),
        },
        {
          key: "delete",
          label: "Excluir negócio",
          icon: Trash2,
          variant: "destructive",
          permission: "crm:manage",
          disabled: deletePending,
          hidden: !onDealDelete,
          onSelect: (deal) => onDealDelete?.(deal),
        },
      ]}
      emptyTitle="Nenhum negócio encontrado."
      emptyDescription="Ajuste os filtros para visualizar negócios do pipeline."
      cardDelay={0.15}
      density={density}
    />
  )
}
