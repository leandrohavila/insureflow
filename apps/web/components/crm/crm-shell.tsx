"use client"

import { CrmModuleTabs } from "@/components/crm/crm-module-tabs"
import { CrmDensityToggle } from "@/components/crm/interaction"
import { CrmWorkspacePreferencesProvider } from "@/lib/hooks/use-crm-workspace-preferences"
import {
  CRM_CHROME,
  CRM_CONTENT_RAIL,
  CRM_WORKSPACE,
} from "@/lib/layout/operational-shell"
import { cn } from "@/lib/utils"

import { RelationshipIndexProvider } from "./relationship-index-provider"
import { CrmWorkspaceDensityShell } from "./crm-workspace-density-shell"

type CrmShellProps = {
  children: React.ReactNode
}

/**
 * Chrome do CRM no slot principal do dashboard (sem sticky empilhado).
 * Topbar fica fixa no flex do DashboardShell; tabs são shrink-0 abaixo dela.
 */
export function CrmShell({ children }: CrmShellProps) {
  return (
    <CrmWorkspacePreferencesProvider>
      <CrmWorkspaceDensityShell className={CRM_WORKSPACE}>
        <header className={CRM_CHROME}>
          <div className="mx-auto flex w-full min-w-0 max-w-[1600px] items-center gap-3 px-4 py-2 md:px-6">
            <div className="min-w-0 flex-1">
              <CrmModuleTabs />
            </div>
            <CrmDensityToggle className="shrink-0" />
          </div>
        </header>

        <RelationshipIndexProvider>
          <div className={cn(CRM_CONTENT_RAIL, "crm-content-rail")}>{children}</div>
        </RelationshipIndexProvider>
      </CrmWorkspaceDensityShell>
    </CrmWorkspacePreferencesProvider>
  )
}
