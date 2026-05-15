"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Filter, Mail, Phone, Upload } from "lucide-react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import {
  CrmRecordTable,
  LifecycleBadge,
  OwnerCell,
  type CrmTableColumn,
} from "@/components/crm/crm-record-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CrmContact } from "@/lib/crm-mock"
import { crmContacts } from "@/lib/crm-mock"
import { easeOut } from "@/lib/motion"

const columns: CrmTableColumn<CrmContact>[] = [
  {
    key: "name",
    header: "Nome",
    render: (row) => (
      <div>
        <p className="font-medium tracking-[-0.02em]">{row.name}</p>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>
    ),
  },
  {
    key: "company",
    header: "Empresa",
    hideOnMobile: true,
    render: (row) => <span className="text-sm text-muted-foreground">{row.company}</span>,
  },
  {
    key: "phone",
    header: "Telefone",
    hideOnMobile: true,
    render: (row) => (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Phone className="size-3 opacity-60" />
        {row.phone}
      </span>
    ),
  },
  {
    key: "lifecycle",
    header: "Estágio",
    render: (row) => <LifecycleBadge label={row.lifecycle} />,
  },
  {
    key: "owner",
    header: "Proprietário",
    className: "text-right",
    render: (row) => <OwnerCell initials={row.ownerInitials} name={row.owner} />,
  },
  {
    key: "activity",
    header: "Última atividade",
    hideOnMobile: true,
    className: "text-right text-muted-foreground",
    render: (row) => <span className="text-xs">{row.lastActivity}</span>,
  },
]

export function ContactsPage() {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10"
    >
      <CrmPageHeader
        badge="Base de contatos"
        title="Contatos"
        description="Pessoas, leads qualificados e clientes — com estágio do ciclo de vida e histórico de interações."
        primaryAction={{ label: "Novo contato" }}
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="size-3.5" strokeWidth={1.5} />
          Importar
        </Button>
      </CrmPageHeader>

      <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar por nome, e-mail ou empresa…"
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Mail className="size-3.5" />
          Campanha
        </Button>
      </motion.div>

      <CrmRecordTable
        data={crmContacts}
        columns={columns}
        getRowId={(row) => row.id}
        title="Todos os contatos"
        subtitle={`${crmContacts.length} registros no workspace`}
      />
    </motion.div>
  )
}
