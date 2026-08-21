"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { CrmMetrics } from "@/components/crm/crm-metrics"
import { CrmPageHeaderActions } from "@/components/crm/crm-page-header-actions"
import { CrmActivityFeed } from "@/components/crm/crm-activity-feed"
import { CRMRightSidebar } from "@/components/crm/crm-right-sidebar"
import { CRMRightSidebarToggle } from "@/components/crm/crm-right-sidebar-toggle"
import { CrmUpcomingActions } from "@/components/crm/crm-upcoming-actions"
import { DealFormDialog } from "@/components/crm/deal-form-dialog"
import { PipelineBoard } from "@/components/crm/pipeline-board"
import { useCanManage } from "@/components/auth/session-provider"
import {
  ContentContainer,
  ErrorState,
  LoadingState,
  OperationalPageLayout,
  OperationalWorkspaceMetrics,
  PageContainer,
  PageHeader,
} from "@/components/design-system"
import { Button, buttonVariants } from "@/components/ui/button"
import { useCreateCrmDeal, useCrmDeals } from "@/lib/data-access/modules/crm"
import { getErrorMessage } from "@/lib/data-access"
import { dsContentLayoutVariant } from "@/lib/design-system"
import { cn } from "@/lib/utils"

export function CrmOverview() {
  const [createOpen, setCreateOpen] = useState(false)
  const canManageCrm = useCanManage("crm:view")
  const dealsQuery = useCrmDeals()
  const createDeal = useCreateCrmDeal()
  const deals = dealsQuery.data ?? []

  return (
    <PageContainer fillHeight>
      <ContentContainer variant={dsContentLayoutVariant.crm}>
        <OperationalPageLayout density="dense">
          <PageHeader
            compact
            className="shrink-0"
            title="Visão geral"
            actions={
              <CrmPageHeaderActions
                primary={
                  canManageCrm ? (
                    <>
                      <Button variant="outline" size="sm" className="h-9">
                        Importar contatos
                      </Button>
                      <Button size="sm" className="h-9" onClick={() => setCreateOpen(true)}>
                        Novo negócio
                      </Button>
                    </>
                  ) : undefined
                }
              />
            }
          />

          {dealsQuery.isLoading ? (
            <LoadingState label="Carregando CRM real…" />
          ) : dealsQuery.isError ? (
            <ErrorState
              title="Não foi possível carregar o CRM."
              description={getErrorMessage(
                dealsQuery.error,
                "Erro ao carregar negócios",
              )}
              onRetry={() => dealsQuery.refetch()}
            />
          ) : (
        <>
          <OperationalWorkspaceMetrics>
            <CrmMetrics deals={deals} density="compact" />
          </OperationalWorkspaceMetrics>

          <CRMRightSidebar
            toolbarDense
            sidebar={
              <>
                <CrmUpcomingActions
                  deals={deals}
                  onCreateDeal={() => setCreateOpen(true)}
                />
                <CrmActivityFeed />
              </>
            }
            header={
              <motion.div className="flex min-w-0 items-center justify-end gap-2">
                <CRMRightSidebarToggle />
              </motion.div>
            }
            prelude={
              <div className="flex shrink-0 items-center justify-between gap-2 pb-0.5">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Pipeline por estágio
                </h2>
                <Link
                  href="/crm/negocios"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "h-7 shrink-0 gap-1 px-2 text-xs text-primary",
                  )}
                >
                  Ver funil
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            }
          >
            <PipelineBoard compact interactive={false} deals={deals} />
          </CRMRightSidebar>
        </>
      )}

      <DealFormDialog
        open={canManageCrm && createOpen}
        pending={createDeal.isPending}
        error={createDeal.error}
        onOpenChange={setCreateOpen}
        onSubmit={(input) => {
          createDeal.mutate(input, {
            onSuccess: () => setCreateOpen(false),
          })
        }}
      />
        </OperationalPageLayout>
      </ContentContainer>
    </PageContainer>
  )
}
