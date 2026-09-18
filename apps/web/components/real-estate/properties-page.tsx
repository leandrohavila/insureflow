"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Edit3, Globe, Globe2, Plus } from "lucide-react"

import {
  ContentContainer,
  DataTable,
  PageContainer,
  PageHeader,
  PageActions,
  PageActionsGroup,
  type DataTableColumn,
  type DataTableRowAction,
} from "@/components/design-system"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { useCanManage } from "@/components/auth/session-provider"
import {
  useProperties,
  usePublishProperty,
  useUnpublishProperty,
} from "@/lib/data-access/modules/properties"
import type { Property } from "@/lib/data-access/modules/properties"
import {
  formatPropertyPrice,
  PROPERTY_PURPOSE_LABELS,
} from "@/lib/real-estate/labels"
import { useRealEstateBusinessUnitId } from "@/lib/real-estate/use-real-estate-business-unit"
import { dsContentLayoutVariant } from "@/lib/design-system"
import { cn } from "@/lib/utils"

export function PropertiesPage() {
  const router = useRouter()
  const canManage = useCanManage("properties:view")
  const businessUnitId = useRealEstateBusinessUnitId()
  const { data, isLoading, error, refetch } = useProperties({
    businessUnitId: businessUnitId ?? undefined,
    limit: 100,
  })
  const publish = usePublishProperty()
  const unpublish = useUnpublishProperty()

  const rows = data?.data ?? []

  const columns: DataTableColumn<Property>[] = [
    {
      key: "title",
      header: "Título",
      render: (row) => row.title,
    },
    {
      key: "purpose",
      header: "Finalidade",
      hideOnMobile: true,
      render: (row) => PROPERTY_PURPOSE_LABELS[row.purpose] ?? row.purpose,
    },
    {
      key: "city",
      header: "Cidade",
      render: (row) => row.city,
    },
    {
      key: "neighborhood",
      header: "Bairro",
      hideOnMobile: true,
      render: (row) => row.neighborhood ?? "—",
    },
    {
      key: "price",
      header: "Valor",
      render: (row) => formatPropertyPrice(row.price, row.purpose),
    },
    {
      key: "published",
      header: "Publicado",
      render: (row) => (
        <Badge variant={row.published ? "default" : "secondary"}>
          {row.published ? "Sim" : "Não"}
        </Badge>
      ),
    },
    {
      key: "featured",
      header: "Destaque",
      hideOnMobile: true,
      render: (row) => (
        <Badge variant={row.featured ? "default" : "outline"}>
          {row.featured ? "Sim" : "Não"}
        </Badge>
      ),
    },
  ]

  const rowActions: DataTableRowAction<Property>[] = [
    {
      key: "edit",
      label: "Editar",
      icon: Edit3,
      onSelect: (row) => router.push(`/real-estate/properties/${row.id}`),
    },
    {
      key: "publish",
      label: "Publicar",
      icon: Globe,
      hidden: (row) => row.published,
      disabled: !canManage || publish.isPending,
      onSelect: (row) => publish.mutate(row.id),
    },
    {
      key: "unpublish",
      label: "Despublicar",
      icon: Globe2,
      hidden: (row) => !row.published,
      disabled: !canManage || unpublish.isPending,
      onSelect: (row) => unpublish.mutate(row.id),
    },
  ]

  return (
    <PageContainer className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-[var(--if-space-2)] md:py-[var(--if-space-3)]">
      <ContentContainer variant={dsContentLayoutVariant.leads}>
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              Imóveis
              <Badge variant="secondary">{rows.length}</Badge>
            </span>
          }
          description="Gerencie o catálogo imobiliário da unidade selecionada."
          actions={
            canManage ? (
              <PageActions>
                <PageActionsGroup>
                  <Link
                    href="/real-estate/properties/new"
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    <Plus className="mr-1.5 size-4" />
                    Novo imóvel
                  </Link>
                </PageActionsGroup>
              </PageActions>
            ) : undefined
          }
        />

        <DataTable
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          rowActions={canManage ? rowActions : undefined}
          onRowClick={(row) => router.push(`/real-estate/properties/${row.id}`)}
          loading={isLoading}
          error={error}
          onRetry={() => refetch()}
          emptyIcon={Building2}
          emptyTitle="Nenhum registro encontrado"
          emptyDescription="Clique em Novo para começar."
          emptyAction={
            canManage ? (
              <Link
                href="/real-estate/properties/new"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                <Plus className="mr-1.5 size-4" />
                Novo imóvel
              </Link>
            ) : null
          }
        />
      </ContentContainer>
    </PageContainer>
  )
}
