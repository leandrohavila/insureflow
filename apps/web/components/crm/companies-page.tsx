"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Building2, Filter, Globe, Upload } from "lucide-react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import {
  CrmRecordTable,
  OwnerCell,
  type CrmTableColumn,
} from "@/components/crm/crm-record-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { CrmCompany } from "@/lib/crm-mock"
import { crmCompanies } from "@/lib/crm-mock"
import { easeOut } from "@/lib/motion"

const columns: CrmTableColumn<CrmCompany>[] = [
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
    key: "industry",
    header: "Setor",
    hideOnMobile: true,
    render: (row) => (
      <Badge variant="outline" className="rounded-full border-white/10 text-[10px]">
        {row.industry}
      </Badge>
    ),
  },
  {
    key: "size",
    header: "Porte",
    hideOnMobile: true,
    render: (row) => <span className="text-sm text-muted-foreground">{row.size}</span>,
  },
  {
    key: "deals",
    header: "Negócios",
    render: (row) => (
      <span className="tabular-metric text-sm font-semibold">{row.deals}</span>
    ),
  },
  {
    key: "revenue",
    header: "Receita",
    hideOnMobile: true,
    render: (row) => <span className="text-sm font-medium">{row.revenue}</span>,
  },
  {
    key: "owner",
    header: "Proprietário",
    className: "text-right",
    render: (row) => <OwnerCell initials={row.ownerInitials} name={row.owner} />,
  },
]

export function CompaniesPage() {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10"
    >
      <CrmPageHeader
        badge="Contas corporativas"
        title="Empresas"
        description="Carteira B2B com domínio, setor, negócios vinculados e receita estimada por conta."
        primaryAction={{ label: "Nova empresa" }}
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="size-3.5" strokeWidth={1.5} />
          Importar
        </Button>
      </CrmPageHeader>

      <motion.div className="relative max-w-md">
        <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Buscar empresas…"
          className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
        />
      </motion.div>

      <CrmRecordTable
        data={crmCompanies}
        columns={columns}
        getRowId={(row) => row.id}
        title="Todas as empresas"
        subtitle={`${crmCompanies.length} contas ativas`}
      />
    </motion.div>
  )
}
