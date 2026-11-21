"use client"

import { Profiler } from "react"
import { hasPermission } from "@repo/auth"
import { CrmCaptureActions } from "@/components/crm/crm-capture-actions"

import {
  ContentContainer,
  PageActions,
  PageActionsGroup,
  PageContainer,
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
import { DashboardPrimaryIndicators } from "@/components/dashboard/dashboard-primary-indicators"
import {
  dashboardAnalyticsGridClassName,
  dashboardExecutiveGridClassName,
  formatDashboardDate,
  getDashboardGreeting,
} from "@/components/dashboard/dashboard-utils"
import { useSession, useCanManage } from "@/components/auth/session-provider"
import { dsContentLayoutVariant, dsTypography } from "@/lib/design-system"
import { useDashboardKpis } from "@/lib/data-access/modules/dashboard/hooks"
import { useLeadCaptureMetrics } from "@/lib/leads/use-lead-capture-metrics"
import { bug010LeadCreateProfiler } from "@/lib/performance/bug010-lead-create"

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
      <PageContainer className="avila-dashboard min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <ContentContainer variant={dsContentLayoutVariant.dashboard}>
          <Stack gap="md" className="dashboard-stack">
            <header className="dashboard-header rounded-2xl border border-[#e4ddd2] bg-[var(--avila-paper)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="dashboard-header-copy min-w-0">
                  <p className={dsTypography.role.meta}>
                    {getDashboardGreeting()}
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-[var(--avila-navy-900)]">
                    Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {formatDashboardDate()}
                  </p>
                </div>
                <PageActions className="w-full sm:w-auto sm:flex-wrap lg:justify-end">
                  <PageActionsGroup className="flex-wrap">
                    <CrmCaptureActions
                      insuranceLabel="Novo Lead Seguro"
                      realEstateLabel="Novo Lead Imobiliário"
                      dealLabel="Novo Negócio"
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
            </header>

            <DashboardPrimaryIndicators
                metrics={captureMetrics.metrics}
                metricsLoading={captureMetrics.isLoading}
                kpis={kpis}
                showLeads={canLeads}
                showClients={canClients}
                showCrm={canCrm}
              />

            {canCrm ? (
              <div className={dashboardExecutiveGridClassName}>
                <DashboardPipelineHero className="border-l-[3px] border-l-[#C09048]" />
                <DashboardPriorities
                  kpis={kpis}
                  crmEnabled={canCrm}
                  quotesEnabled={canQuotes}
                  leadsEnabled={canLeads}
                />
              </div>
            ) : (
              <DashboardPriorities
                kpis={kpis}
                crmEnabled={canCrm}
                quotesEnabled={canQuotes}
                leadsEnabled={canLeads}
              />
            )}

            {showFunnel ? (
              <DashboardCommercialFunnel
                kpis={kpis}
                leadsEnabled={canLeads}
                clientsEnabled={canClients}
                quotesEnabled={canQuotes}
              />
            ) : null}

            {showAnalytics ? (
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
            ) : null}

            {canCrm ? (
              <DashboardAgendaPreview canCreate={canManageCrm} />
            ) : null}

            {canQuotes ? (
              <DashboardQuotesProposals
                kpis={kpis}
                canCreateQuotes={canManageQuotes}
              />
            ) : null}
          </Stack>
        </ContentContainer>
      </PageContainer>
    </Profiler>
  )
}
