"use client"

import Link from "next/link"
import {
  Building2,
  CalendarDays,
  Globe,
  UserPlus,
} from "lucide-react"

import {
  ContentContainer,
  DataTable,
  Grid,
  PageContainer,
  PageHeader,
  PageActions,
  PageActionsGroup,
  Section,
  Stack,
  StatCard,
  type DataTableColumn,
} from "@/components/design-system"
import { buttonVariants } from "@/components/ui/button"
import { useCanManage } from "@/components/auth/session-provider"
import {
  usePropertyLeadsInbox,
  useRealEstateDashboardStats,
} from "@/lib/data-access/modules/properties"
import type { PropertyLeadListItem } from "@/lib/data-access/modules/properties"
import {
  formatPropertyDate,
} from "@/lib/real-estate/labels"
import { useRealEstateBusinessUnitId } from "@/lib/real-estate/use-real-estate-business-unit"
import { dsContentLayoutVariant } from "@/lib/design-system"
import { cn } from "@/lib/utils"

export function RealEstateDashboard() {
  const businessUnitId = useRealEstateBusinessUnitId()
  const canManage = useCanManage("properties:view")
  const statsQuery = useRealEstateDashboardStats(businessUnitId)
  const leadsQuery = usePropertyLeadsInbox()

  const stats = statsQuery.data
  const recentLeads = (leadsQuery.data ?? []).slice(0, 8)

  const columns: DataTableColumn<PropertyLeadListItem>[] = [
    {
      key: "name",
      header: "Nome",
      render: (row) => row.name,
    },
    {
      key: "phone",
      header: "Telefone",
      hideOnMobile: true,
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
      <ContentContainer variant={dsContentLayoutVariant.dashboard}>
        <Stack gap="sm">
          <PageHeader
            title="Dashboard Imobiliário"
            description="Visão operacional do catálogo, leads e portal público."
            actions={
              <PageActions>
                <PageActionsGroup>
                  {canManage ? (
                    <Link
                      href="/real-estate/properties/new"
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      + Novo imóvel
                    </Link>
                  ) : null}
                </PageActionsGroup>
              </PageActions>
            }
          />

          <Section>
            <Grid columns="4">
              <StatCard
                label="Imóveis cadastrados"
                value={stats?.totalProperties ?? "—"}
                icon={Building2}
                loading={statsQuery.isLoading}
                error={statsQuery.error ? "Erro ao carregar" : undefined}
              />
              <StatCard
                label="Imóveis publicados"
                value={stats?.publishedProperties ?? "—"}
                icon={Globe}
                tone="success"
                loading={statsQuery.isLoading}
              />
              <StatCard
                label="Leads recebidos"
                value={stats?.leadsReceived ?? "—"}
                icon={UserPlus}
                tone="primary"
                loading={statsQuery.isLoading}
              />
              <StatCard
                label="Visitas agendadas"
                value={stats?.scheduledVisits ?? 0}
                icon={CalendarDays}
                description="Em breve"
                tone="neutral"
                loading={statsQuery.isLoading}
              />
            </Grid>
          </Section>

          <Section>
            <DataTable
              title="Últimos leads imobiliários"
              subtitle="Interesses recebidos pelo portal e canais conectados."
              data={recentLeads}
              columns={columns}
              getRowId={(row) => row.id}
              loading={leadsQuery.isLoading}
              error={leadsQuery.error}
              onRetry={() => leadsQuery.refetch()}
              emptyTitle="Nenhum lead imobiliário"
              emptyDescription="Quando houver interesse em imóveis publicados, os leads aparecerão aqui."
            />
          </Section>
        </Stack>
      </ContentContainer>
    </PageContainer>
  )
}
