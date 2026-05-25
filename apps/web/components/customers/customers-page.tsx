"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  Building2,
  Edit3,
  Filter,
  Mail,
  Phone,
  Search,
  Trash2,
  Upload,
  User,
  type LucideIcon,
} from "lucide-react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { PermissionGate } from "@/components/auth/permission-gate"
import { useCanManage } from "@/components/auth/session-provider"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CustomerDialog } from "@/components/customers/customer-dialog"
import { Input } from "@/components/ui/input"
import type {
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
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 400

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
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const [type, setType] = useState<CustomerType | "all">("all")
  const [status, setStatus] = useState<CustomerStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const reduce = useReducedMotion()
  const canManageCustomers = useCanManage("clients:view")

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
        primaryAction={
          canManageCustomers
            ? {
                label: "Novo cliente",
                onClick: () => {
                  setEditingCustomer(null)
                  setDialogOpen(true)
                },
              }
            : undefined
        }
      >
        <PermissionGate permission="clients:manage">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="size-3.5" strokeWidth={1.5} />
            Importar
          </Button>
        </PermissionGate>
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
          value={meta?.counts?.pj ?? 0}
        />
        <CustomerMetric
          icon={Mail}
          label="Com e-mail"
          value={meta?.counts?.withEmail ?? 0}
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
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
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
          <PermissionGate permission="clients:manage">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Novo cliente
            </Button>
          </PermissionGate>
        }
        onRowClick={
          canManageCustomers
            ? (row) => {
                setEditingCustomer(row)
                setDialogOpen(true)
              }
            : undefined
        }
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
        open={canManageCustomers && dialogOpen}
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
