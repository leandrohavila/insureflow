"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Building2, Edit3, Eye, Globe, Globe2, Plus } from "lucide-react"

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
import { PropertyPreviewDialog } from "@/components/real-estate/property-preview"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { useCanManage } from "@/components/auth/session-provider"
import {
  useProperties,
  usePublishProperty,
  useSetPropertiesPublication,
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
  const batch = useSetPropertiesPublication()
  const [selected, setSelected] = useState<string[]>([])
  const [preview, setPreview] = useState<Property | null>(null)

  const rows = data?.data ?? []
  const selectedRows = rows.filter((row) => selected.includes(row.id))
  const allSelected = rows.length > 0 && selectedRows.length === rows.length

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function toggleAll() {
    setSelected(allSelected ? [] : rows.map((row) => row.id))
  }

  const columns: DataTableColumn<Property>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          aria-label="Selecionar todos"
          checked={allSelected}
          onChange={toggleAll}
          onClick={(event) => event.stopPropagation()}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          aria-label={`Selecionar ${row.title}`}
          checked={selected.includes(row.id)}
          onChange={() => toggle(row.id)}
          onClick={(event) => event.stopPropagation()}
        />
      ),
    },
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
      header: "Publicado no Portal",
      render: (row) => (
        <Badge variant={row.published ? "default" : "secondary"}>
          {row.published ? "Publicado" : "Não publicado"}
        </Badge>
      ),
    },
    {
      key: "portalOrder",
      header: "Ordem",
      hideOnMobile: true,
      render: (row) => row.portalOrder ?? 0,
    },
    {
      key: "launch",
      header: "Lançamento",
      hideOnMobile: true,
      render: (row) => (
        <Badge variant={row.isLaunch ? "default" : "outline"}>
          {row.isLaunch ? "Sim" : "Não"}
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
      key: "preview",
      label: "Pré-visualizar",
      icon: Eye,
      onSelect: (row) => setPreview(row),
    },
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
          description="Publique o catálogo no portal, defina destaques e a ordem de exibição."
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

        {canManage && selectedRows.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedRows.length} selecionado(s)
            </span>
            <Button
              type="button"
              size="sm"
              disabled={batch.isPending}
              onClick={() => {
                batch.mutate(
                  { ids: selectedRows.map((row) => row.id), published: true },
                  { onSuccess: () => setSelected([]) },
                )
              }}
            >
              Publicar no portal
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={batch.isPending}
              onClick={() => {
                batch.mutate(
                  { ids: selectedRows.map((row) => row.id), published: false },
                  { onSuccess: () => setSelected([]) },
                )
              }}
            >
              Despublicar
            </Button>
          </div>
        ) : null}

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
        <PropertyPreviewDialog
          property={preview}
          open={preview != null}
          onOpenChange={(open) => {
            if (!open) setPreview(null)
          }}
        />
      </ContentContainer>
    </PageContainer>
  )
}
