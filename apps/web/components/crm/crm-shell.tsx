"use client"

import { CrmWorkspacePreferencesProvider } from "@/lib/hooks/use-crm-workspace-preferences"
import {
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
 * Chrome do CRM no slot principal. Tabs duplicadas da sidebar foram
 * removidas — a navegação operacional vive no menu.
 */
export function CrmShell({ children }: CrmShellProps) {
  return (
    <CrmWorkspacePreferencesProvider>
      <CrmWorkspaceDensityShell className={CRM_WORKSPACE}>
        <RelationshipIndexProvider>
          <div className={cn(CRM_CONTENT_RAIL, "crm-content-rail")}>{children}</div>
        </RelationshipIndexProvider>
      </CrmWorkspaceDensityShell>
    </CrmWorkspacePreferencesProvider>
  )
}
