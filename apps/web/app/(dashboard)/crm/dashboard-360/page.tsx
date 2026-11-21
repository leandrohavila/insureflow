import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { Dashboard360Workspace } from "@/components/crm/dashboard-360-workspace"
import { CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL } from "@/lib/crm/crm-layout-classes"
import { cn } from "@/lib/utils"

export default function CrmDashboard360Page() {
  return (
    <div className={cn(CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL)}>
      <CrmPageHeader
        badge="CRM"
        title="Dashboard 360"
        description="Clientes, receita prevista, renovação, cross-sell e conversão por empresa e corretor."
      />
      <Dashboard360Workspace />
    </div>
  )
}
