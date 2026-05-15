"use client"

import { useReducedMotion } from "framer-motion"

import type { CrmDeal } from "@/lib/crm-mock"
import { crmDeals, formatCurrency, pipelineStages } from "@/lib/crm-mock"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { GlassCard } from "@/components/dashboard/glass-card"
import { cn } from "@/lib/utils"

const stageLabel = Object.fromEntries(
  pipelineStages.map((s) => [s.id, s.label])
) as Record<string, string>

type CrmDealsListProps = {
  onDealSelect?: (deal: CrmDeal) => void
}

export function CrmDealsList({ onDealSelect }: CrmDealsListProps) {
  const reduce = useReducedMotion()

  return (
    <GlassCard delay={0.15} hover={false} className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.02]">
              <TableHead className="h-11 pl-5 text-[10px] font-semibold tracking-[0.12em] uppercase md:pl-6">
                Negócio
              </TableHead>
              <TableHead className="hidden h-11 text-[10px] font-semibold tracking-[0.12em] uppercase md:table-cell">
                Contato
              </TableHead>
              <TableHead className="h-11 text-[10px] font-semibold tracking-[0.12em] uppercase">
                Estágio
              </TableHead>
              <TableHead className="hidden h-11 text-[10px] font-semibold tracking-[0.12em] uppercase sm:table-cell">
                Produto
              </TableHead>
              <TableHead className="h-11 text-right text-[10px] font-semibold tracking-[0.12em] uppercase">
                Valor
              </TableHead>
              <TableHead className="hidden h-11 pr-5 text-right text-[10px] font-semibold tracking-[0.12em] uppercase lg:table-cell md:pr-6">
                Responsável
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crmDeals.map((deal, i) => (
              <TableRow
                key={deal.id}
                onClick={onDealSelect ? () => onDealSelect(deal) : undefined}
                className={cn(
                  "group/row border-white/[0.05] transition-colors",
                  onDealSelect && "cursor-pointer hover:bg-primary/[0.06]",
                  i % 2 === 1 && "bg-white/[0.015]",
                  !reduce && "animate-in fade-in duration-500"
                )}
                style={reduce ? undefined : { animationDelay: `${80 + i * 40}ms` }}
              >
                <TableCell className="py-3.5 pl-5 md:pl-6">
                  <div>
                    <p className="font-medium tracking-[-0.02em]">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">{deal.company}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden py-3.5 text-sm text-muted-foreground md:table-cell">
                  {deal.contact}
                </TableCell>
                <TableCell className="py-3.5">
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/30 bg-primary/10 text-[10px] text-primary"
                  >
                    {stageLabel[deal.stage]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden py-3.5 text-sm text-muted-foreground sm:table-cell">
                  {deal.product}
                </TableCell>
                <TableCell className="py-3.5 text-right font-medium tabular-nums">
                  {formatCurrency(deal.value)}
                </TableCell>
                <TableCell className="hidden py-3.5 pr-5 md:table-cell md:pr-6">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}
