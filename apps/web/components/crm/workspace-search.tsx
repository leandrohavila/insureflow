"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Briefcase,
  Loader2,
  Search,
  User,
  UserRound,
  Users,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  searchOperationalWorkspace,
  useRelationshipIndex,
} from "@/lib/crm/relationship"
import type { WorkspaceSearchResultKind } from "@/lib/crm/relationship"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import { useCustomers } from "@/lib/data-access/modules/customers"
import { useLeads } from "@/lib/data-access/modules/leads"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

const SEARCH_DEBOUNCE_MS = 300

const KIND_META: Record<
  WorkspaceSearchResultKind,
  { label: string; icon: typeof User }
> = {
  contact: { label: "Contato", icon: User },
  company: { label: "Empresa", icon: Building2 },
  deal: { label: "Negócio", icon: Briefcase },
  lead: { label: "Lead", icon: UserRound },
  customer: { label: "Cliente", icon: Users },
}

type WorkspaceSearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkspaceSearchDialog({
  open,
  onOpenChange,
}: WorkspaceSearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const relationship = useRelationshipIndex()
  const dealsQuery = useCrmDeals()
  const leadsQuery = useLeads({ limit: 500, page: 1 })
  const customersQuery = useCustomers({ limit: 500, page: 1 })

  const isLoading =
    relationship.isLoading ||
    dealsQuery.isLoading ||
    leadsQuery.isLoading ||
    customersQuery.isLoading

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return []
    return searchOperationalWorkspace({
      index: relationship.index,
      deals: dealsQuery.data ?? [],
      leads: leadsQuery.data?.data ?? [],
      customers: customersQuery.data?.data ?? [],
      term: debouncedQuery,
      limit: 24,
    })
  }, [
    customersQuery.data?.data,
    debouncedQuery,
    dealsQuery.data,
    leadsQuery.data?.data,
    relationship.index,
  ])

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  function handleSelect(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-white/10 px-4 py-3">
          <DialogTitle className="text-base">Busca operacional</DialogTitle>
          <DialogDescription className="text-xs">
            Telefone, WhatsApp, e-mail, documento, empresa, negócio ou nome.
          </DialogDescription>
        </DialogHeader>

        <div className="relative border-b border-white/10 px-4 py-3">
          <Search className="pointer-events-none absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Digite para buscar no workspace…"
            className="h-10 border-white/10 bg-white/[0.04] pl-10"
          />
        </div>

        <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
          {isLoading && debouncedQuery.trim() ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Indexando workspace…
            </div>
          ) : null}

          {!isLoading && !debouncedQuery.trim() ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Busque contatos, empresas, negócios, leads e clientes.
            </p>
          ) : null}

          {!isLoading && debouncedQuery.trim() && results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhum resultado para &quot;{debouncedQuery}&quot;.
            </p>
          ) : null}

          {results.map((result) => {
            const meta = KIND_META[result.kind]
            const Icon = meta.icon
            return (
              <button
                key={`${result.kind}:${result.id}`}
                type="button"
                onClick={() => handleSelect(result.href)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left",
                  "transition-colors hover:bg-white/[0.05]",
                )}
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.05] ring-1 ring-white/10">
                  <Icon className="size-4 text-primary" strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium">{result.title}</span>
                    <span className="crm-text-micro shrink-0 rounded-full border border-white/10 px-1.5 py-0.5 text-muted-foreground">
                      {meta.label}
                    </span>
                  </span>
                  <span className="crm-text-meta block truncate text-muted-foreground">
                    {result.subtitle}
                  </span>
                  {result.meta ? (
                    <span className="crm-text-micro block truncate text-muted-foreground/70">
                      {result.meta}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

type WorkspaceSearchTriggerProps = {
  className?: string
}

export function WorkspaceSearchTrigger({ className }: WorkspaceSearchTriggerProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <div className={className}>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60"
          strokeWidth={1.5}
        />
        <Input
          type="search"
          readOnly
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          placeholder="Buscar em todo o workspace…"
          className="h-10 cursor-pointer rounded-full border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-[13px] shadow-inner shadow-black/20 transition-all duration-300 placeholder:text-muted-foreground/50 focus-visible:border-primary/35 focus-visible:bg-white/[0.06] focus-visible:shadow-[0_0_0_3px_oklch(0.64_0.19_252/0.12)] md:h-10"
          aria-label="Busca operacional do workspace"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60 md:inline">
          ⌘K
        </kbd>
      </div>
      <WorkspaceSearchDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
