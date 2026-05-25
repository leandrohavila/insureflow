"use client"

import Link from "next/link"
import { Target } from "lucide-react"

import { PermissionGate } from "@/components/auth/permission-gate"
import { GlassCard } from "@/components/dashboard/glass-card"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  CRM_SECTION_SUBTITLE,
  CRM_SECTION_TITLE,
} from "@/lib/crm/crm-layout-classes"
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
    <GlassCard delay={0.12} hover={false} className="p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className={CRM_SECTION_TITLE}>Próximas ações</h2>
        <PermissionGate permission="crm:manage">
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-7"
            aria-label="Novo negócio"
            onClick={onCreateDeal}
          >
            <Target className="size-3.5" />
          </Button>
        </PermissionGate>
      </div>
      <ul className="space-y-2">
        {openDeals.length === 0 ? (
          <li className={CRM_SECTION_SUBTITLE}>
            Nenhum negócio aberto no pipeline.
          </li>
        ) : (
          openDeals.slice(0, 4).map((deal) => (
            <li
              key={deal.id}
              className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-2"
            >
              <p className="truncate text-sm font-medium leading-snug text-foreground">
                {deal.title}
              </p>
              <p className="mt-0.5 truncate text-sm text-foreground/60">
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
          "mt-2 h-auto p-0 text-sm text-primary",
        )}
      >
        Ver todos os negócios
      </Link>
    </GlassCard>
  )
}
