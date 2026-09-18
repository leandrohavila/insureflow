"use client"

import { useMemo, useState } from "react"
import { Briefcase, Search, UserRound } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import { useLeads } from "@/lib/data-access/modules/leads"
import { CRM_FILTER_INPUT } from "@/lib/crm/crm-layout-classes"
import { cn } from "@/lib/utils"

export type TaskContextSelection = {
  dealId?: string
  leadId?: string
  label: string
}

type TaskContextPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (ctx: TaskContextSelection) => void
  title?: string
  description?: string
}

export function TaskContextPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Selecionar vínculo",
  description = "Toda atividade precisa estar vinculada a um negócio ou lead.",
}: TaskContextPickerDialogProps) {
  const [query, setQuery] = useState("")
  const dealsQuery = useCrmDeals()
  const leadsQuery = useLeads({ limit: 50 })

  const deals = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = dealsQuery.data ?? []
    if (!q) return all.slice(0, 8)
    return all
      .filter(
        (deal) =>
          deal.title.toLowerCase().includes(q) ||
          deal.company.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [dealsQuery.data, query])

  const leads = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = leadsQuery.data?.data ?? []
    if (!q) return all.slice(0, 8)
    return all
      .filter(
        (lead) =>
          lead.name.toLowerCase().includes(q) ||
          (lead.company ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [leadsQuery.data?.data, query])

  function pick(ctx: TaskContextSelection) {
    onSelect(ctx)
    onOpenChange(false)
    setQuery("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="space-y-1 border-b crm-stroke-faint px-5 py-4">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>

        <div className="px-5 py-3">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar negócio ou lead…"
              className={cn(CRM_FILTER_INPUT, "h-9 w-full rounded-lg pl-9")}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[min(52vh,420px)] overflow-y-auto px-3 pb-4">
          <section className="mb-3">
            <h3 className="crm-text-micro mb-1.5 px-2 tracking-wide">Negócios</h3>
            <ul className="space-y-0.5">
              {deals.length === 0 ? (
                <li className="crm-text-meta px-2 py-2">Nenhum negócio encontrado.</li>
              ) : (
                deals.map((deal) => (
                  <li key={deal.id}>
                    <button
                      type="button"
                      onClick={() =>
                        pick({
                          dealId: deal.id,
                          label: `${deal.title} · ${deal.company}`,
                        })
                      }
                      className="task-context-option"
                    >
                      <Briefcase className="size-3.5 shrink-0 text-primary/80" strokeWidth={1.5} />
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {deal.title}
                        </span>
                        <span className="crm-text-meta block truncate">{deal.company}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h3 className="crm-text-micro mb-1.5 px-2 tracking-wide">Leads</h3>
            <ul className="space-y-0.5">
              {leads.length === 0 ? (
                <li className="crm-text-meta px-2 py-2">Nenhum lead encontrado.</li>
              ) : (
                leads.map((lead) => (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() =>
                        pick({
                          leadId: lead.id,
                          label: lead.name,
                        })
                      }
                      className="task-context-option"
                    >
                      <UserRound className="size-3.5 shrink-0 text-sky-400/90" strokeWidth={1.5} />
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {lead.name}
                        </span>
                        {lead.company ? (
                          <span className="crm-text-meta block truncate">{lead.company}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
