"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Building2, Filter, Globe, Upload } from "lucide-react"

import { CompanySheetV2 } from "@/components/crm/company-sheet-v2"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { RelationshipWorkspaceBoundary } from "@/components/crm/relationship-workspace-boundary"
import { PermissionGate } from "@/components/auth/permission-gate"
import { useCanManage } from "@/components/auth/session-provider"
import {
  CrmRecordTable,
  OwnerCell,
  type CrmTableColumn,
} from "@/components/crm/crm-record-table"
import { ErrorState, LoadingState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  buildReturnToFromCurrentLocation,
  closeEntitySheetNavigation,
} from "@/lib/crm/entity-sheet-navigation"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { useRelationshipIndexContext } from "@/components/crm/relationship-index-provider"
import {
  filterCompanies,
  findCompanyById,
  type OperationalCompany,
} from "@/lib/crm/relationship"
import { openCrmCreateDeal } from "@/lib/crm/crm-create-navigation"
import { formatCurrency } from "@/lib/data-access/modules/crm"
import { CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL } from "@/lib/crm/crm-layout-classes"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useFocusReturn } from "@/lib/hooks/use-focus-return"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const SEARCH_DEBOUNCE_MS = 400

const columns: CrmTableColumn<OperationalCompany>[] = [
  {
    key: "name",
    header: "Empresa",
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-white/[0.05] ring-1 ring-white/10">
          <Building2 className="size-4 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-medium tracking-[-0.02em]">{row.name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="size-3 opacity-60" />
            {row.domain}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "contacts",
    header: "Contatos",
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {row.contactCount}
      </span>
    ),
  },
  {
    key: "deals",
    header: "Negócios",
    render: (row) => (
      <span className="tabular-metric text-sm font-semibold">{row.dealCount}</span>
    ),
  },
  {
    key: "pipeline",
    header: "Pipeline",
    hideOnMobile: true,
    render: (row) => (
      <Badge
        variant="outline"
        className="rounded-full border-white/10 text-[10px]"
      >
        {formatCurrency(row.pipelineValue)}
      </Badge>
    ),
  },
  {
    key: "revenue",
    header: "Volume total",
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm font-medium">{formatCurrency(row.totalValue)}</span>
    ),
  },
  {
    key: "owner",
    header: "Proprietário",
    className: "text-right",
    render: (row) => (
      <OwnerCell initials={row.ownerInitials} name={row.owner} />
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

export function CompaniesPage() {
  const reduce = useReducedMotion()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const canManageCrm = useCanManage("crm:view")
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const { captureFocus, restoreFocus } = useFocusReturn()
  const relationship = useRelationshipIndexContext()

  const syncCompanyParam = useCallback(
    (companyId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (companyId) {
        params.set("company", companyId)
        params.set("sheet", "v2")
      } else {
        params.delete("company")
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    const companyId = searchParams.get("company")
    setSelectedCompanyId(companyId)
  }, [searchParams])

  const companies = useMemo(
    () => filterCompanies(relationship.index, search),
    [relationship.index, search],
  )

  const selectedCompany = findCompanyById(
    relationship.index,
    selectedCompanyId,
  )

  const returnTo = buildReturnToFromCurrentLocation(pathname, searchParams, {
    excludeParams: ["company", "sheet", "returnTo", "from"],
  })

  const handleCompanySelect = useCallback(
    (company: OperationalCompany) => {
      captureFocus()
      setSelectedCompanyId(company.id)
      syncCompanyParam(company.id)
    },
    [captureFocus, syncCompanyParam],
  )

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, ease: easeOut }}
      className={cn(CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL, "gap-8")}
    >
      <CrmPageHeader
        badge="Hub empresarial"
        title="Empresas"
        description="Workspace V2 — contas corporativas consolidadas com negócios, contatos e timeline."
        primaryAction={
          canManageCrm
            ? {
                label: "Nova empresa",
                onClick: () => openCrmCreateDeal(router),
              }
            : undefined
        }
      >
        <PermissionGate permission="crm:manage">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="size-3.5" strokeWidth={1.5} />
            Importar
          </Button>
        </PermissionGate>
      </CrmPageHeader>

      <motion.div className="relative max-w-md">
        <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Buscar por empresa, domínio, negócio ou contato…"
          className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </motion.div>

      {relationship.isLoading ? (
        <LoadingState label="Consolidando contas corporativas…" />
      ) : relationship.isError ? (
        <ErrorState
          title="Não foi possível carregar empresas."
          description="Erro ao consolidar relacionamentos do CRM."
          onRetry={() => relationship.refetch()}
        />
      ) : (
        <RelationshipWorkspaceBoundary
          title="Não foi possível exibir empresas."
          description="Erro ao consolidar relacionamentos do CRM."
        >
          <CrmRecordTable
            data={companies}
            columns={columns}
            getRowId={(row) => row.id}
            onRowClick={handleCompanySelect}
            title="Todas as empresas"
            subtitle={`${companies.length} conta(s) corporativa(s) operacional(is)`}
          />
        </RelationshipWorkspaceBoundary>
      )}

      <CompanySheetV2
        company={selectedCompany}
        open={selectedCompanyId !== null && selectedCompany !== null}
        returnTo={returnTo}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCompanyId(null)
            closeEntitySheetNavigation({
              router,
              pathname,
              searchParams,
              entityType: "company",
            })
            restoreFocus()
          }
        }}
      />
    </motion.div>
  )
}
