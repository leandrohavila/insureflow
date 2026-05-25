"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  AlertTriangle,
  Filter,
  HeartPulse,
  Shield,
  Upload,
} from "lucide-react"

import { CustomerSheetV2 } from "@/components/crm/customer-sheet-v2"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { RelationshipWorkspaceBoundary } from "@/components/crm/relationship-workspace-boundary"
import {
  CrmRecordTable,
  type CrmTableColumn,
} from "@/components/crm/crm-record-table"
import { CustomerLifecycleBadge } from "@/components/crm/sheet-sections/customer-sections"
import { PermissionGate } from "@/components/auth/permission-gate"
import { useCanManage } from "@/components/auth/session-provider"
import { ErrorState, LoadingState } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  buildPortfolioCustomers,
  filterPortfolioCustomers,
  portfolioMetrics,
  type PortfolioCustomer,
} from "@/lib/crm/customer-health"
import { customerLifecycleLabel } from "@/lib/crm/customer-lifecycle"
import { renewalStatusLabel } from "@/lib/crm/customer-renewal"
import {
  buildReturnToFromCurrentLocation,
  closeEntitySheetNavigation,
} from "@/lib/crm/entity-sheet-navigation"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL } from "@/lib/crm/crm-layout-classes"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import { useCustomers } from "@/lib/data-access/modules/customers"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useFocusReturn } from "@/lib/hooks/use-focus-return"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const SEARCH_DEBOUNCE_MS = 400
const PORTFOLIO_LIMIT = 500

const columns: CrmTableColumn<PortfolioCustomer>[] = [
  {
    key: "name",
    header: "Segurado / cliente",
    render: (row) => (
      <div>
        <p className="font-medium tracking-[-0.02em]">{row.name}</p>
        <p className="text-xs text-muted-foreground">
          {row.companyName ?? row.email ?? "Sem empresa"}
        </p>
      </div>
    ),
  },
  {
    key: "lifecycle",
    header: "Lifecycle operacional",
    render: (row) => <CustomerLifecycleBadge stage={row.lifecycleStage} />,
  },
  {
    key: "products",
    header: "Produtos",
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.products[0] ?? "Seguro"}
        {row.products.length > 1 ? ` +${row.products.length - 1}` : ""}
      </span>
    ),
  },
  {
    key: "policies",
    header: "Apólices",
    hideOnMobile: true,
    render: (row) => (
      <span className="tabular-nums text-sm text-muted-foreground">
        {row.policyCount}
      </span>
    ),
  },
  {
    key: "health",
    header: "Health",
    render: (row) => (
      <Badge
        variant="outline"
        className={cn(
          "rounded-full text-[10px]",
          row.healthLevel === "risk" && "border-rose-400/35 text-rose-200",
          row.healthLevel === "attention" && "border-amber-400/35 text-amber-200",
          row.healthLevel === "good" && "border-sky-400/35 text-sky-200",
          row.healthLevel === "excellent" &&
            "border-emerald-400/35 text-emerald-200",
        )}
      >
        {row.healthScore}%
      </Badge>
    ),
  },
  {
    key: "renewal",
    header: "Renovação",
    hideOnMobile: true,
    render: (row) => (
      <span className="text-xs text-muted-foreground">
        {row.renewalDate
          ? renewalStatusLabel(row.renewalStatus)
          : "—"}
      </span>
    ),
  },
  {
    key: "activity",
    header: "Última interação",
    hideOnMobile: true,
    className: "text-right text-muted-foreground",
    render: (row) => (
      <span className="text-xs">
        {formatLastInteraction(row.lastInteractionAt)}
      </span>
    ),
  },
]

export function CustomersPortfolioPage() {
  const reduce = useReducedMotion()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const canManage = useCanManage("clients:view")
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  )
  const { captureFocus, restoreFocus } = useFocusReturn()

  const customersQuery = useCustomers({ page: 1, limit: PORTFOLIO_LIMIT })
  const dealsQuery = useCrmDeals()

  const portfolio = useMemo(
    () =>
      buildPortfolioCustomers({
        customers: customersQuery.data?.data ?? [],
        deals: dealsQuery.data ?? [],
      }),
    [customersQuery.data?.data, dealsQuery.data],
  )

  const customers = useMemo(
    () => filterPortfolioCustomers(portfolio, search),
    [portfolio, search],
  )

  const metrics = useMemo(() => portfolioMetrics(portfolio), [portfolio])

  const selectedCustomer =
    customers.find((row) => row.id === selectedCustomerId) ??
    portfolio.find((row) => row.id === selectedCustomerId) ??
    null

  const syncCustomerParam = useCallback(
    (customerId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (customerId) {
        params.set("customer", customerId)
        params.set("sheet", "v2")
      } else {
        params.delete("customer")
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    const customerId = searchParams.get("customer")
    setSelectedCustomerId(customerId)
  }, [searchParams])

  const returnTo = buildReturnToFromCurrentLocation(pathname, searchParams, {
    excludeParams: ["customer", "sheet", "returnTo", "from"],
  })

  const handleCustomerSelect = useCallback(
    (customer: PortfolioCustomer) => {
      captureFocus()
      setSelectedCustomerId(customer.id)
      syncCustomerParam(customer.id)
    },
    [captureFocus, syncCustomerParam],
  )

  const isLoading = customersQuery.isLoading || dealsQuery.isLoading
  const isError = customersQuery.isError && dealsQuery.isError

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className={cn(CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL, "gap-8")}
    >
      <CrmPageHeader
        badge="Carteira pós-venda"
        title="Clientes"
        description="Workspace operacional — segurados, apólices, renovações e health da carteira ativa."
        primaryAction={canManage ? { label: "Novo cliente" } : undefined}
      >
        <PermissionGate permission="clients:manage">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="size-3.5" strokeWidth={1.5} />
            Importar
          </Button>
        </PermissionGate>
      </CrmPageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Carteira total",
            value: metrics.total,
            icon: Shield,
          },
          {
            label: "Ativos operacionais",
            value: metrics.active,
            icon: HeartPulse,
          },
          {
            label: "Renovações (90d)",
            value: metrics.renewalsSoon,
            icon: AlertTriangle,
          },
          {
            label: "Em risco",
            value: metrics.atRisk,
            icon: AlertTriangle,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="glass-panel rounded-2xl border border-white/[0.06] px-4 py-3"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <metric.icon className="size-3.5" />
              {metric.label}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <motion.div className="relative max-w-md">
        <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Buscar por nome, documento, empresa, lifecycle ou produto…"
          className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </motion.div>

      {isLoading ? (
        <LoadingState label="Carregando carteira operacional…" />
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar a carteira."
          description="Erro ao consolidar clientes e negócios vinculados."
          onRetry={() => {
            void customersQuery.refetch()
            void dealsQuery.refetch()
          }}
        />
      ) : (
        <RelationshipWorkspaceBoundary
          title="Não foi possível exibir a carteira."
          description="Erro ao renderizar clientes operacionais."
        >
          <CrmRecordTable
            data={customers}
            columns={columns}
            getRowId={(row) => row.id}
            onRowClick={handleCustomerSelect}
            title="Carteira ativa"
            subtitle={`${customers.length} segurado(s) · lifecycle: ${customerLifecycleLabel("active_customer")} e onboarding`}
          />
        </RelationshipWorkspaceBoundary>
      )}

      <CustomerSheetV2
        customer={selectedCustomer}
        deals={dealsQuery.data ?? []}
        open={selectedCustomerId !== null && selectedCustomer !== null}
        returnTo={returnTo}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCustomerId(null)
            closeEntitySheetNavigation({
              router,
              pathname,
              searchParams,
              entityType: "customer",
            })
            restoreFocus()
          }
        }}
      />
    </motion.div>
  )
}
