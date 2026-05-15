"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { recentLeads } from "@/lib/dashboard-mock"
import { easeOut } from "@/lib/motion"
import { GlassCard } from "@/components/dashboard/glass-card"

function stageBadgeClass(estagio: string) {
  switch (estagio) {
    case "Novo":
      return "border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_12px_-4px_rgba(56,189,248,0.4)]"
    case "Qualificação":
      return "border-violet-400/30 bg-violet-500/10 text-violet-200 shadow-[0_0_12px_-4px_rgba(167,139,250,0.35)]"
    case "Proposta":
      return "border-primary/40 bg-primary/15 text-blue-100 shadow-[0_0_12px_-4px_oklch(0.64_0.19_252/0.35)]"
    case "Negociação":
      return "border-amber-400/35 bg-amber-500/10 text-amber-200 shadow-[0_0_12px_-4px_rgba(251,191,36,0.3)]"
    default:
      return "border-white/10 bg-white/[0.04] text-muted-foreground"
  }
}

function LeadRow({
  lead,
  index,
}: {
  lead: (typeof recentLeads)[number]
  index: number
}) {
  const reduce = useReducedMotion()

  return (
    <TableRow
      className={cn(
        "group/row border-white/[0.05] transition-colors duration-200",
        "hover:bg-gradient-to-r hover:from-primary/[0.08] hover:to-transparent",
        index % 2 === 1 && "bg-white/[0.015]",
        !reduce && "animate-in fade-in slide-in-from-left-1 fill-mode-both duration-500"
      )}
      style={reduce ? undefined : { animationDelay: `${120 + index * 60}ms` }}
    >
      <TableCell className="py-4 pl-5 md:pl-6">
        <motion.div
          className="flex items-center gap-3"
          whileHover={reduce ? undefined : { x: 3 }}
          transition={{ duration: 0.2, ease: easeOut }}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/5 text-xs font-semibold text-primary ring-1 ring-primary/25">
            {lead.nome
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <motion.div>
            <p className="font-medium tracking-[-0.02em] text-foreground">{lead.nome}</p>
            <p className="text-xs text-muted-foreground md:hidden">{lead.contato}</p>
          </motion.div>
        </motion.div>
      </TableCell>
      <TableCell className="hidden py-4 text-[13px] text-muted-foreground md:table-cell">
        {lead.contato}
      </TableCell>
      <TableCell className="hidden py-4 text-[13px] text-muted-foreground lg:table-cell">
        {lead.origem}
      </TableCell>
      <TableCell className="py-4">
        <motion.div whileHover={reduce ? undefined : { scale: 1.05 }}>
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
              stageBadgeClass(lead.estagio)
            )}
          >
            {lead.estagio}
          </Badge>
        </motion.div>
      </TableCell>
      <TableCell className="hidden py-4 text-right font-medium tabular-nums tracking-tight text-foreground sm:table-cell">
        {lead.valor}
      </TableCell>
      <TableCell className="hidden py-4 pr-5 text-right text-[13px] text-muted-foreground tabular-nums md:table-cell md:pr-6">
        {lead.data}
      </TableCell>
      <TableCell className="py-4 pr-4 md:pr-6">
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-0 transition-opacity duration-200 group-hover/row:opacity-100"
          aria-label={`Ações para ${lead.nome}`}
        >
          <MoreHorizontal className="size-4" strokeWidth={1.5} />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function RecentLeadsTable() {
  return (
    <GlassCard delay={0.25} hover={false} className="overflow-hidden p-0">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
        className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 md:px-6"
      >
        <motion.div>
          <p className="text-sm font-medium tracking-[-0.02em] text-foreground">
            Pipeline ativo
          </p>
          <p className="text-xs text-muted-foreground">
            {recentLeads.length} oportunidades recentes
          </p>
        </motion.div>
        <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
          Ver todos
          <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="overflow-x-auto"
      >
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.02]">
              <TableHead className="h-11 min-w-[160px] pl-5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase md:pl-6">
                Lead
              </TableHead>
              <TableHead className="hidden h-11 min-w-[140px] text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase md:table-cell">
                Contato
              </TableHead>
              <TableHead className="hidden h-11 min-w-[120px] text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase lg:table-cell">
                Origem
              </TableHead>
              <TableHead className="h-11 min-w-[100px] text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Estágio
              </TableHead>
              <TableHead className="hidden h-11 min-w-[90px] text-right text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:table-cell">
                Valor
              </TableHead>
              <TableHead className="hidden h-11 min-w-[80px] pr-5 text-right text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase md:table-cell md:pr-6">
                Data
              </TableHead>
              <TableHead className="h-11 w-10 pr-4 md:pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentLeads.map((lead, i) => (
              <LeadRow key={lead.id} lead={lead} index={i} />
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </GlassCard>
  )
}
