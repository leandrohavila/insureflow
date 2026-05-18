"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  Building2,
  Edit3,
  Filter,
  Loader2,
  Mail,
  Phone,
  Search,
  Trash2,
  Upload,
  User,
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
  CreateCustomerInput,
  Customer,
  CustomerListFilters,
  CustomerStatus,
  CustomerType,
} from "@/lib/data-access/modules/customers"
import {
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/lib/data-access/modules/customers"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

const statusLabels: Record<CustomerStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  archived: "Arquivado",
}

const statusStyles: Record<CustomerStatus, string> = {
  active: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  inactive: "border-amber-400/35 bg-amber-500/10 text-amber-200",
  archived: "border-zinc-400/25 bg-zinc-500/10 text-zinc-300",
}

export function CustomersPage() {
  const [search, setSearch] = useState("")
  const [type, setType] = useState<CustomerType | "all">("all")
  const [status, setStatus] = useState<CustomerStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const reduce = useReducedMotion()

  const filters = useMemo<CustomerListFilters>(
    () => ({
      search,
      type,
      status,
      page,
      limit: PAGE_SIZE,
    }),
    [page, search, status, type],
  )

  const customersQuery = useCustomers(filters)
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer(filters)
  const deleteCustomer = useDeleteCustomer(filters)

  const customers = customersQuery.data?.data ?? []
  const meta = customersQuery.data?.meta

  useEffect(() => {
    setPage(1)
  }, [search, status, type])

  const columns = useMemo<DataTableColumn<Customer>[]>(
    () => [
      {
        key: "name",
        header: "Cliente",
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9 border border-white/10">
              <AvatarFallback className="bg-primary/20 text-[11px] font-semibold text-primary">
                {row.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium tracking-[-0.02em]">{row.name}</p>
              <p className="text-xs text-muted-foreground">{row.document}</p>
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: "Tipo",
        render: (row) => (
          <Badge
            variant="outline"
            className="rounded-full border-white/10 text-[10px]"
          >
            {row.type}
          </Badge>
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
        key: "updated",
        header: "Atualizado",
        hideOnMobile: true,
        render: (row) => (
          <span className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("pt-BR").format(new Date(row.updatedAt))}
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
        badge="Base de clientes"
        title="Clientes"
        description="Cadastro central de pessoas físicas e jurídicas, pronto para vínculos com empresas, contatos, apólices, sinistros, WhatsApp e negócios do CRM."
        primaryAction={{
          label: "Novo cliente",
          onClick: () => {
            setEditingCustomer(null)
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
        <CustomerMetric
          icon={User}
          label="Clientes"
          value={meta?.total ?? customers.length}
        />
        <CustomerMetric
          icon={Building2}
          label="Pessoa jurídica"
          value={customers.filter((customer) => customer.type === "PJ").length}
        />
        <CustomerMetric
          icon={Mail}
          label="Com e-mail"
          value={customers.filter((customer) => Boolean(customer.email)).length}
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
            placeholder="Buscar por nome, documento, e-mail ou telefone…"
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as CustomerType | "all")
            }
            className="flex h-9 rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">Todos os tipos</option>
            {CUSTOMER_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as CustomerStatus | "all")
            }
            className="flex h-9 rounded-md border border-input bg-background/40 px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="all">Todos os status</option>
            {CUSTOMER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      <DataTable
        data={customers}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        loading={customersQuery.isLoading}
        loadingLabel="Carregando clientes…"
        error={customersQuery.isError ? customersQuery.error : null}
        errorTitle="Não foi possível carregar clientes."
        onRetry={() => customersQuery.refetch()}
        emptyIcon={User}
        emptyTitle="Nenhum cliente encontrado."
        emptyDescription="Ajuste os filtros ou cadastre o primeiro cliente da carteira."
        emptyAction={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            Novo cliente
          </Button>
        }
        onRowClick={(row) => {
          setEditingCustomer(row)
          setDialogOpen(true)
        }}
        rowActions={[
          {
            key: "edit",
            label: "Editar cliente",
            icon: Edit3,
            permission: "clients:manage",
            onSelect: (row) => {
              setEditingCustomer(row)
              setDialogOpen(true)
            },
          },
          {
            key: "delete",
            label: "Excluir cliente",
            icon: Trash2,
            variant: "destructive",
            disabled: deleteCustomer.isPending,
            permission: "clients:manage",
            onSelect: (row) => {
              if (window.confirm(`Excluir cliente ${row.name}?`)) {
                deleteCustomer.mutate(row.id)
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
        title="Todos os clientes"
        subtitle={`${meta?.total ?? customers.length} registros na carteira`}
      />

      <CustomerDialog
        customer={editingCustomer}
        open={dialogOpen}
        pending={createCustomer.isPending || updateCustomer.isPending}
        error={createCustomer.error ?? updateCustomer.error}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingCustomer(null)
        }}
        onSubmit={(input) => {
          if (editingCustomer) {
            updateCustomer.mutate(
              { id: editingCustomer.id, input },
              { onSuccess: () => setDialogOpen(false) },
            )
            return
          }

          createCustomer.mutate(input, {
            onSuccess: () => setDialogOpen(false),
          })
        }}
      />
    </motion.div>
  )
}

function CustomerMetric({
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

type CustomerForm = {
  type: CustomerType
  name: string
  document: string
  email: string
  phone: string
  status: CustomerStatus
}

function CustomerDialog({
  customer,
  open,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: {
  customer: Customer | null
  open: boolean
  pending: boolean
  error: unknown
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateCustomerInput) => void
}) {
  const [form, setForm] = useState<CustomerForm>({
    type: "PF",
    name: "",
    document: "",
    email: "",
    phone: "",
    status: "active",
  })

  useEffect(() => {
    if (!open) return
    setForm({
      type: customer?.type ?? "PF",
      name: customer?.name ?? "",
      document: customer?.document ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      status: customer?.status ?? "active",
    })
  }, [customer, open])

  function update<K extends keyof CustomerForm>(
    key: K,
    value: CustomerForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim() || !form.document.trim()) return

    onSubmit({
      type: form.type,
      name: form.name.trim(),
      document: form.document.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      status: form.status,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {customer ? "Editar cliente" : "Novo cliente"}
            </DialogTitle>
            <DialogDescription>
              Mantenha os dados essenciais do cliente em uma base única e
              isolada por tenant.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Tipo</span>
              <select
                value={form.type}
                onChange={(event) =>
                  update("type", event.target.value as CustomerType)
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {CUSTOMER_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  update("status", event.target.value as CustomerStatus)
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {CUSTOMER_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {statusLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Nome</span>
              <Input
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Ex.: Maria Oliveira ou Transportes Sul"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Documento</span>
              <Input
                required
                value={form.document}
                onChange={(event) => update("document", event.target.value)}
                placeholder="CPF ou CNPJ"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">E-mail</span>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="cliente@empresa.com.br"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Telefone</span>
              <Input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="+55 11 99999-9999"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {getErrorMessage(error, "Erro ao salvar cliente")}
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
              ) : customer ? (
                "Salvar alterações"
              ) : (
                "Salvar cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
