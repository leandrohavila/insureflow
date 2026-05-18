"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowRightLeft,
  Edit3,
  Filter,
  Loader2,
  Mail,
  Phone,
  Search,
  Trash2,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/data-access"
import type {
  CreateLeadInput,
  Lead,
  LeadListFilters,
  LeadStatus,
} from "@/lib/data-access/modules/leads"
import {
  LEAD_STATUSES,
  useConvertLead,
  useCreateLead,
  useDeleteLead,
  useLeads,
  useUpdateLead,
} from "@/lib/data-access/modules/leads"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

const statusLabels: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
}

const statusStyles: Record<LeadStatus, string> = {
  new: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  contacted: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  qualified: "border-primary/35 bg-primary/15 text-primary-foreground",
  converted: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  lost: "border-rose-400/35 bg-rose-500/10 text-rose-200",
}

export function LeadsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<LeadStatus | "all">("all")
  const [source, setSource] = useState("")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const reduce = useReducedMotion()

  const filters = useMemo<LeadListFilters>(
    () => ({
      search,
      status,
      source,
      page,
      limit: PAGE_SIZE,
    }),
    [page, search, source, status],
  )

  const leadsQuery = useLeads(filters)
  const createLead = useCreateLead()
  const updateLead = useUpdateLead(filters)
  const deleteLead = useDeleteLead(filters)
  const convertLead = useConvertLead(filters)

  const leads = leadsQuery.data?.data ?? []
  const meta = leadsQuery.data?.meta

  useEffect(() => {
    setPage(1)
  }, [search, source, status])

  const columns = useMemo<DataTableColumn<Lead>[]>(
    () => [
      {
        key: "name",
        header: "Lead",
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9 border border-white/10">
              <AvatarFallback className="bg-primary/20 text-[11px] font-semibold text-primary">
                {row.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium tracking-[-0.02em]">{row.name}</p>
              <p className="text-xs text-muted-foreground">
                {row.company || "Sem empresa"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "contact",
        header: "Contato",
        hideOnMobile: true,
        render: (row) => (
          <div className="space-y-1 text-xs text-muted-foreground">
            {row.email ? (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3 opacity-60" />
                {row.email}
              </span>
            ) : null}
            {row.phone ? (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3 opacity-60" />
                {row.phone}
              </span>
            ) : null}
            {!row.email && !row.phone ? "Sem contato" : null}
          </div>
        ),
      },
      {
        key: "source",
        header: "Origem",
        hideOnMobile: true,
        render: (row) => (
          <Badge
            variant="outline"
            className="rounded-full border-white/10 text-[10px]"
          >
            {row.source || "Não informada"}
          </Badge>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full text-[10px] font-semibold",
              statusStyles[row.status],
            )}
          >
            {statusLabels[row.status]}
          </Badge>
        ),
      },
      {
        key: "owner",
        header: "Responsável",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.assignedTo || "Sem responsável"}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:gap-10 md:px-8 md:py-10"
    >
      <CrmPageHeader
        badge="Captação comercial"
        title="Leads"
        description="Entrada real de oportunidades da corretora, com qualificação e conversão direta para negócios no CRM."
        primaryAction={{
          label: "Novo lead",
          onClick: () => {
            setEditingLead(null)
            setDialogOpen(true)
          },
        }}
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="size-3.5" strokeWidth={1.5} />
          Importar
        </Button>
      </CrmPageHeader>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <LeadMetric
          icon={UserPlus}
          label="Leads"
          value={meta?.total ?? leads.length}
        />
        <LeadMetric
          icon={ArrowRightLeft}
          label="Convertidos"
          value={leads.filter((lead) => lead.status === "converted").length}
        />
        <LeadMetric
          icon={Filter}
          label="Qualificados"
          value={leads.filter((lead) => lead.status === "qualified").length}
        />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: easeOut }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar por nome, empresa, contato, origem ou responsável…"
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as LeadStatus | "all")
            }
            className="flex h-9 rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">Todos os status</option>
            {LEAD_STATUSES.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
          <Input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Origem"
            className="h-9 w-36 border-white/[0.08] bg-white/[0.04]"
          />
        </div>
      </motion.div>

      <DataTable
        data={leads}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        loading={leadsQuery.isLoading}
        loadingLabel="Carregando leads…"
        error={leadsQuery.isError ? leadsQuery.error : null}
        errorTitle="Não foi possível carregar leads."
        onRetry={() => leadsQuery.refetch()}
        emptyIcon={UserPlus}
        emptyTitle="Nenhum lead encontrado."
        emptyDescription="Ajuste os filtros ou cadastre o primeiro lead."
        emptyAction={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            Novo lead
          </Button>
        }
        onRowClick={(row) => {
          setEditingLead(row)
          setDialogOpen(true)
        }}
        rowActions={[
          {
            key: "convert",
            label: "Converter em negócio",
            icon: ArrowRightLeft,
            disabled: (row) => row.status === "converted" || convertLead.isPending,
            permission: "leads:manage",
            onSelect: (row) => {
              if (window.confirm(`Converter ${row.name} em negócio do CRM?`)) {
                convertLead.mutate({ id: row.id })
              }
            },
          },
          {
            key: "edit",
            label: "Editar lead",
            icon: Edit3,
            permission: "leads:manage",
            onSelect: (row) => {
              setEditingLead(row)
              setDialogOpen(true)
            },
          },
          {
            key: "delete",
            label: "Excluir lead",
            icon: Trash2,
            variant: "destructive",
            disabled: deleteLead.isPending,
            permission: "leads:manage",
            onSelect: (row) => {
              if (window.confirm(`Excluir lead ${row.name}?`)) {
                deleteLead.mutate(row.id)
              }
            },
          },
        ]}
        pagination={{
          meta: {
            page: meta?.page ?? page,
            totalPages: meta?.totalPages ?? 1,
            total: meta?.total,
          },
          onPageChange: setPage,
        }}
        title="Todos os leads"
        subtitle={`${meta?.total ?? leads.length} registros na captação`}
      />

      {(createLead.error || updateLead.error || convertLead.error) && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {getErrorMessage(
            createLead.error ?? updateLead.error ?? convertLead.error,
            "Erro ao processar lead",
          )}
        </p>
      )}

      <LeadDialog
        lead={editingLead}
        open={dialogOpen}
        pending={createLead.isPending || updateLead.isPending}
        error={createLead.error ?? updateLead.error}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingLead(null)
        }}
        onSubmit={(input) => {
          if (editingLead) {
            updateLead.mutate(
              { id: editingLead.id, input },
              { onSuccess: () => setDialogOpen(false) },
            )
            return
          }

          createLead.mutate(input, {
            onSuccess: () => setDialogOpen(false),
          })
        }}
      />
    </motion.div>
  )
}

function LeadMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <div className="glass-panel rounded-2xl border border-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="tabular-metric text-xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  )
}

type LeadForm = {
  name: string
  email: string
  phone: string
  company: string
  source: string
  status: LeadStatus
  notes: string
  assignedTo: string
}

function LeadDialog({
  lead,
  open,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: {
  lead: Lead | null
  open: boolean
  pending: boolean
  error: unknown
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateLeadInput) => void
}) {
  const [form, setForm] = useState<LeadForm>({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    status: "new",
    notes: "",
    assignedTo: "",
  })

  useEffect(() => {
    if (!open) return
    setForm({
      name: lead?.name ?? "",
      email: lead?.email ?? "",
      phone: lead?.phone ?? "",
      company: lead?.company ?? "",
      source: lead?.source ?? "",
      status: lead?.status ?? "new",
      notes: lead?.notes ?? "",
      assignedTo: lead?.assignedTo ?? "",
    })
  }, [lead, open])

  function update<K extends keyof LeadForm>(key: K, value: LeadForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim()) return

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      company: form.company.trim() || undefined,
      source: form.source.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      assignedTo: form.assignedTo.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
            <DialogDescription>
              Cadastre a oportunidade de entrada e acompanhe até a conversão no
              CRM.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Nome</span>
              <Input
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Ex.: Marina Costa"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">E-mail</span>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="lead@email.com"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Telefone</span>
              <Input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="+55 11 99999-9999"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Empresa</span>
              <Input
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
                placeholder="Ex.: Transportes Sul"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Origem</span>
              <Input
                value={form.source}
                onChange={(event) => update("source", event.target.value)}
                placeholder="whatsapp, site, indicação..."
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  update("status", event.target.value as LeadStatus)
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {LEAD_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {statusLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Responsável</span>
              <Input
                value={form.assignedTo}
                onChange={(event) => update("assignedTo", event.target.value)}
                placeholder="Ex.: Ana Costa"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Notas</span>
              <Input
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Contexto da oportunidade"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar lead")}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando…
                </>
              ) : lead ? (
                "Salvar alterações"
              ) : (
                "Salvar lead"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
