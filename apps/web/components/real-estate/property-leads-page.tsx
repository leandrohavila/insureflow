"use client"

import {
  ContentContainer,
  DataTable,
  PageContainer,
  PageHeader,
  type DataTableColumn,
} from "@/components/design-system"
import { usePropertyLeadsInbox } from "@/lib/data-access/modules/properties"
import type { PropertyLeadListItem } from "@/lib/data-access/modules/properties"
import { formatPropertyDate } from "@/lib/real-estate/labels"
import { dsContentLayoutVariant } from "@/lib/design-system"

export function PropertyLeadsPage() {
  const leadsQuery = usePropertyLeadsInbox()
  const rows = leadsQuery.data ?? []

  const columns: DataTableColumn<PropertyLeadListItem>[] = [
    {
      key: "name",
      header: "Nome",
      render: (row) => row.name,
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
      key: "property",
      header: "Imóvel",
      render: (row) => row.propertyTitle,
    },
    {
      key: "createdAt",
      header: "Data",
      render: (row) => formatPropertyDate(row.createdAt),
    },
  ]

  return (
    <PageContainer className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-[var(--if-space-2)] md:py-[var(--if-space-3)]">
      <ContentContainer variant={dsContentLayoutVariant.leads}>
        <PageHeader
          title="Leads Imobiliários"
          description="Interesses recebidos a partir do portal e demais canais."
        />

        <DataTable
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={leadsQuery.isLoading}
          error={leadsQuery.error}
          onRetry={() => leadsQuery.refetch()}
          emptyTitle="Nenhum lead imobiliário"
          emptyDescription="Os leads aparecerão aqui quando houver interesse em imóveis."
        />
      </ContentContainer>
    </PageContainer>
  )
}
