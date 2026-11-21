"use client"

import Link from "next/link"
import { Target } from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import { AppCard, EmptyState } from "@/components/design-system"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  formatCurrency,
  type CrmDeal,
} from "@/lib/data-access/modules/crm"
import { cn } from "@/lib/utils"

type CrmUpcomingActionsProps = {
  deals: CrmDeal[]
  onCreateDeal?: () => void
}

export function CrmUpcomingActions({
  deals,
  onCreateDeal,
}: CrmUpcomingActionsProps) {
  const openDeals = deals.filter((deal) => deal.status === "open")

  return (
    <AppCard className="border-[#D6CFC4]! bg-white! text-[#10294B] shadow-[0_1px_2px_rgb(16_41_75/0.04)]">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-[#10294B]">Próximas ações</h2>
        <PermissionGate permission="crm:manage">
          <Button
            variant="crmSecondary"
            size="icon"
            aria-label="Novo negócio"
            onClick={onCreateDeal}
          >
            <Target className="size-3.5" aria-hidden />
          </Button>
        </PermissionGate>
      </div>
      <ul className="space-y-2">
        {openDeals.length === 0 ? (
          <li>
            <EmptyState
              title="Nenhum negócio aberto"
              description="Nenhum negócio aberto no pipeline."
            />
          </li>
        ) : (
          openDeals.slice(0, 4).map((deal) => (
            <li
              key={deal.id}
              className="rounded-lg border border-[#D6CFC4] bg-white px-2.5 py-2"
            >
              <p className="truncate text-sm font-medium leading-snug text-[#10294B]">
                {deal.title}
              </p>
              <p className="mt-0.5 truncate text-sm text-[#5C6578]">
                {deal.company} · {formatCurrency(deal.value)}
              </p>
            </li>
          ))
        )}
      </ul>
      <Link
        href="/crm/negocios"
        className={cn(
          buttonVariants({ variant: "link", size: "sm" }),
          "mt-2 h-auto p-0 text-sm text-[#10294B]",
        )}
      >
        Ver todos os negócios
      </Link>
    </AppCard>
  )
}
