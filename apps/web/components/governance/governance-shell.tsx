import type { ReactNode } from "react"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { GovernanceSubnav } from "@/components/governance/governance-subnav"
import { SettingsNav } from "@/components/settings/settings-subnav"

type GovernanceShellProps = {
  title: string
  description?: string
  children: ReactNode
}

export function GovernanceShell({
  title,
  description,
  children,
}: GovernanceShellProps) {
  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <CrmPageHeader
        badge="Configurações"
        title={title}
        description={description}
      />
      <SettingsNav />
      <GovernanceSubnav />
      {children}
    </div>
  )
}
