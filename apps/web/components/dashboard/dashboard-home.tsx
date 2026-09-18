"use client"

import { Profiler } from "react"
import { hasPermission } from "@repo/auth"
import { CrmCaptureActions } from "@/components/crm/crm-capture-actions"

import {
  ContentContainer,
  PageActions,
  PageActionsGroup,
  PageContainer,
  Section,
  Stack,
} from "@/components/design-system"
import { DashboardAgendaPreview } from "@/components/dashboard/dashboard-agenda-preview"
import { DashboardCommercialFunnel } from "@/components/dashboard/dashboard-commercial-funnel"
import { DashboardCustomers } from "@/components/dashboard/dashboard-customers"
import { DashboardFinancialProduction } from "@/components/dashboard/dashboard-financial-production"
import { DashboardInsuranceIndicators } from "@/components/dashboard/dashboard-insurance-indicators"
import { DashboardPipelineHero } from "@/components/dashboard/dashboard-pipeline-hero"
import { DashboardPriorities } from "@/components/dashboard/dashboard-priorities"
import { DashboardQuotesProposals } from "@/components/dashboard/dashboard-quotes-proposals"
import { DashboardSummary } from "@/components/dashboard/dashboard-summary"
import { GrupoAvilaExecutiveKpiGrid } from "@/components/dashboard/grupo-avila-kpi-grid"
import { DashboardCommercialOpsKpis } from "@/components/dashboard/dashboard-commercial-ops-kpis"
import {
  dashboardAnalyticsGridClassName,
  dashboardExecutiveGridClassName,
  dashboardSectionGapClassName,
  formatDashboardDate,
  getDashboardGreeting,
} from "@/components/dashboard/dashboard-utils"
import { useSession, useCanManage } from "@/components/auth/session-provider"
import {
  dsContentLayoutVariant,
  dsLayout,
  dsTypography,
} from "@/lib/design-system"
import { useDashboardKpis } from "@/lib/data-access/modules/dashboard/hooks"
import { useLeadCaptureMetrics } from "@/lib/leads/use-lead-capture-metrics"
import { bug010LeadCreateProfiler } from "@/lib/performance/bug010-lead-create"
import { cn } from "@/lib/utils"

export function DashboardHome() {
  const { session } = useSession()
  const canLeads = hasPermission(session, "leads:view")
  const { kpis } = useDashboardKpis(session)
  const captureMetrics = useLeadCaptureMetrics({ enabled: canLeads })
  const canManageCrm = useCanManage("crm:view")
  const canManageQuotes = useCanManage("quotes:view")
  const canClients = hasPermission(session, "clients:view")
  const canCrm = hasPermission(session, "crm:view")
  const canQuotes = hasPermission(session, "quotes:view")

  const showFunnel = canLeads || canClients || canQuotes
  const showAnalytics = canCrm || canClients || canQuotes

  return (
    <Profiler
      id="BUG010.1 Dashboard"
      onRender={bug010LeadCreateProfiler("dashboard")}
    >
      <PageContainer className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-[var(--if-space-2)] md:py-[var(--if-space-3)]">
        <ContentContainer variant={dsContentLayoutVariant.dashboard}>
          <Stack gap="sm">
            <header
              className={cn(
                dsLayout.pageHeader.compact.className,
                "gap-[var(--if-space-2)]",
              )}
            >
              <div className={dsLayout.pageHeader.titleRow.className}>
                <div
                  className={cn(
                    dsLayout.pageHeader.content.className,
                    "space-y-0.5",
                  )}
                >
                  <p className={dsTypography.role.meta}>
                    {getDashboardGreeting()}
                  </p>
                  <h1 className="text-xl font-semibold leading-tight tracking-tight text-foreground">
                    Dashboard
                  </h1>
                </div>
                <PageActions className="sm:flex-wrap">
                  <span className="hidden text-sm text-muted-foreground lg:inline">
                    {formatDashboardDate()}
                  </span>
                  <PageActionsGroup className="flex-wrap">
                    <CrmCaptureActions
                      insuranceEnabled={
                        captureMetrics.isLoading ||
                        Boolean(captureMetrics.insuranceBusinessUnitId)
                      }
                      realEstateEnabled={
                        captureMetrics.isLoading ||
                        Boolean(captureMetrics.realEstateBusinessUnitId)
                      }
                    />
                  </PageActionsGroup>
                </PageActions>
              </div>
              <p className={cn(dsTypography.role.meta, "lg:hidden")}>
                {formatDashboardDate()}
              </p>
            </header>

            {canLeads ? (
              <Section className={dashboardSectionGapClassName}>
                <GrupoAvilaExecutiveKpiGrid
                  metrics={captureMetrics.metrics}
                  loading={captureMetrics.isLoading}
                />
              </Section>
            ) : null}

            {canCrm ? (
              <Section className={dashboardSectionGapClassName}>
                <DashboardCommercialOpsKpis />
              </Section>
            ) : null}

            <Section className={dashboardSectionGapClassName}>
              <DashboardSummary kpis={kpis} />
            </Section>

            {canCrm ? (
              <Section className={dashboardSectionGapClassName}>
                <div className={dashboardExecutiveGridClassName}>
                  <DashboardPipelineHero className="min-h-[190px] lg:min-h-[205px]" />
                  <Stack gap="sm" className="min-w-0">
                    <DashboardPriorities
                      kpis={kpis}
                      crmEnabled={canCrm}
                      quotesEnabled={canQuotes}
                      leadsEnabled={canLeads}
                    />
                    <DashboardAgendaPreview canCreate={canManageCrm} />
                  </Stack>
                </div>
              </Section>
            ) : (
              <Section className={dashboardSectionGapClassName}>
                <DashboardPriorities
                  kpis={kpis}
                  crmEnabled={canCrm}
                  quotesEnabled={canQuotes}
                  leadsEnabled={canLeads}
                />
              </Section>
            )}

            {showFunnel ? (
              <Section className={dashboardSectionGapClassName}>
                <DashboardCommercialFunnel
                  kpis={kpis}
                  leadsEnabled={canLeads}
                  clientsEnabled={canClients}
                  quotesEnabled={canQuotes}
                />
              </Section>
            ) : null}

            {showAnalytics ? (
              <Section className={dashboardSectionGapClassName}>
                <div className={dashboardAnalyticsGridClassName}>
                  {canCrm ? (
                    <DashboardFinancialProduction
                      kpis={kpis}
                      quotesEnabled={canQuotes}
                    />
                  ) : null}
                  <DashboardInsuranceIndicators
                    kpis={kpis}
                    quotesEnabled={canQuotes}
                  />
                  <DashboardCustomers kpis={kpis} enabled={canClients} />
                </div>
              </Section>
            ) : null}

            {canQuotes ? (
              <Section className={dashboardSectionGapClassName}>
                <DashboardQuotesProposals
                  kpis={kpis}
                  canCreateQuotes={canManageQuotes}
                />
              </Section>
            ) : null}
          </Stack>
        </ContentContainer>
      </PageContainer>
    </Profiler>
  )
}
