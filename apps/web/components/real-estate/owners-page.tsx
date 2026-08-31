"use client"

import { Users } from "lucide-react"

import {
  ContentContainer,
  DataTable,
  PageContainer,
  PageHeader,
  type DataTableColumn,
} from "@/components/design-system"
import { Badge } from "@/components/ui/badge"
import { usePersons } from "@/lib/data-access/modules/properties"
import type { Person } from "@/lib/data-access/modules/properties"
import { formatPropertyDate } from "@/lib/real-estate/labels"
import { dsContentLayoutVariant } from "@/lib/design-system"

export function OwnersPage() {
  const personsQuery = usePersons()
  const rows = personsQuery.data ?? []

  const columns: DataTableColumn<Person>[] = [
    {
      key: "name",
      header: "Nome",
      render: (row) => row.name,
    },
    {
      key: "kind",
      header: "Tipo",
      hideOnMobile: true,
      render: (row) => (row.kind === "COMPANY" ? "Empresa" : "Pessoa física"),
    },
    {
      key: "document",
      header: "Documento",
      hideOnMobile: true,
      render: (row) => row.document ?? "—",
    },
    {
      key: "phone",
      header: "Telefone",
      render: (row) => row.phone ?? "—",
    },
    {
      key: "email",
      header: "E-mail",
      hideOnMobile: true,
      render: (row) => row.email ?? "—",
    },
    {
      key: "createdAt",
      header: "Cadastro",
      hideOnMobile: true,
      render: (row) => formatPropertyDate(row.createdAt),
    },
  ]

  return (
    <PageContainer className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-[var(--if-space-2)] md:py-[var(--if-space-3)]">
      <ContentContainer variant={dsContentLayoutVariant.leads}>
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              Proprietários
              <Badge variant="secondary">{rows.length}</Badge>
            </span>
          }
          description="Pessoas vinculadas ao domínio imobiliário (Person)."
        />

        <DataTable
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={personsQuery.isLoading}
          error={personsQuery.error}
          onRetry={() => personsQuery.refetch()}
          emptyIcon={Users}
          emptyTitle="Nenhum registro encontrado"
          emptyDescription="Clique em Novo para começar."
        />
      </ContentContainer>
    </PageContainer>
  )
}
