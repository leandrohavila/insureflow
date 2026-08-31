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
import { useRealEstateDashboardStats } from "@/lib/data-access/modules/properties"
import { useLeads } from "@/lib/data-access/modules/leads"
import type { Lead } from "@/lib/data-access/modules/leads"
import { leadOwnerDisplayName } from "@/lib/leads/lead-owner"
import {
  REAL_ESTATE_LEAD_STATUS_LABELS,
} from "@/lib/real-estate/lead-status"
import { useRealEstateBusinessUnitId } from "@/lib/real-estate/use-real-estate-business-unit"
import { dsContentLayoutVariant } from "@/lib/design-system"
import { cn } from "@/lib/utils"

export function RealEstateDashboard() {
  const businessUnitId = useRealEstateBusinessUnitId()
  const canManage = useCanManage("properties:view")
  const statsQuery = useRealEstateDashboardStats(businessUnitId)
  const leadsQuery = useLeads(
    {
      businessUnitId: businessUnitId ?? undefined,
      page: 1,
      limit: 8,
    },
    { enabled: Boolean(businessUnitId) },
  )

  const stats = statsQuery.data
  const recentLeads = leadsQuery.data?.data ?? []

  const columns: DataTableColumn<Lead>[] = [
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
      key: "source",
      header: "Origem",
      hideOnMobile: true,
      render: (row) => row.source ?? "—",
    },
    {
      key: "owner",
      header: "Responsável",
      hideOnMobile: true,
      render: (row) => leadOwnerDisplayName(row) || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => REAL_ESTATE_LEAD_STATUS_LABELS[row.status],
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
                value={leadsQuery.data?.meta.total ?? stats?.leadsReceived ?? "—"}
                icon={UserPlus}
                tone="primary"
                loading={statsQuery.isLoading || leadsQuery.isLoading}
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
              emptyTitle="Nenhum registro encontrado"
              emptyDescription="Clique em Novo para começar."
              emptyAction={
                canManage ? (
                  <Link
                    href="/real-estate/leads"
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Novo Lead Imobiliário
                  </Link>
                ) : null
              }
            />
          </Section>
        </Stack>
      </ContentContainer>
    </PageContainer>
  )
}
