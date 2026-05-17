"use client"

import { motion } from "framer-motion"
import {
  Building2,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  User,
} from "lucide-react"

import type { CrmDeal } from "@/lib/crm-api"
import {
  formatCurrency,
  pipelineStages,
  stageLabelMap,
} from "@/lib/crm-api"
import { crmActivities } from "@/lib/crm-mock"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type DealDetailSheetProps = {
  deal: CrmDeal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: MessageSquare,
  note: MessageSquare,
  quote: MessageSquare,
} as const

export function DealDetailSheet({ deal, open, onOpenChange }: DealDetailSheetProps) {
  if (!deal) return null

  const stageInfo = pipelineStages.find((s) => s.id === deal.stage)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-white/[0.08] bg-background/95 p-0 backdrop-blur-xl sm:max-w-lg"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-white/[0.06] px-6 py-5 text-left">
            <SheetDescription className="text-xs text-primary">
              {stageLabelMap[deal.stage]}
            </SheetDescription>
            <SheetTitle className="text-xl font-semibold tracking-[-0.03em]">
              {deal.title}
            </SheetTitle>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {formatCurrency(deal.value)}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Mail className="size-3.5" />
                E-mail
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Phone className="size-3.5" />
                Ligar
              </Button>
              <Button size="sm" className="gap-1.5">
                <MessageSquare className="size-3.5" />
                Nota
              </Button>
            </div>
          </SheetHeader>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto px-6 py-5"
          >
            <section className="space-y-4">
              <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Propriedades do negócio
              </h3>
              <dl className="space-y-3 text-sm">
                <PropertyRow icon={Building2} label="Empresa" value={deal.company} />
                <PropertyRow icon={User} label="Contato" value={deal.contact} />
                {deal.email && <PropertyRow icon={Mail} label="E-mail" value={deal.email} />}
                <PropertyRow icon={Calendar} label="Produto" value={deal.product} />
                <PropertyRow
                  icon={User}
                  label="Proprietário"
                  value={
                    <span className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="bg-primary/20 text-[9px] text-primary">
                          {deal.ownerInitials}
                        </AvatarFallback>
                      </Avatar>
                      {deal.owner}
                    </span>
                  }
                />
                <PropertyRow
                  label="Estágio"
                  value={
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-primary/10 text-primary"
                    >
                      {stageInfo?.label}
                    </Badge>
                  }
                />
                <PropertyRow label="Prioridade" value={deal.priority} />
              </dl>
            </section>

            <Separator className="my-6 bg-white/[0.06]" />

            <section className="space-y-4">
              <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Atividades recentes
              </h3>
              <ul className="space-y-4">
                {crmActivities.slice(0, 4).map((act) => {
                  const Icon = activityIcons[act.type]
                  return (
                    <li key={act.id} className="flex gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] ring-1 ring-white/10">
                        <Icon className="size-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">{act.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{act.description}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground/70">
                          {act.time} · {act.user}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PropertyRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-3 last:border-0">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-3.5 shrink-0 opacity-60" />}
        {label}
      </dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  )
}
