import { CommunicationDashboardWorkspace } from "@/components/automation/communication-dashboard-workspace"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { AutomationNav } from "@/components/settings/settings-subnav"
import { requirePermission } from "@/lib/auth/guards"

export default async function CommunicationPage() {
  await requirePermission("automation:view")

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <CrmPageHeader
        badge="Automação"
        title="Comunicação comercial"
        description="Envio, entrega, leitura e respostas via Evolution API — filtrados por empresa e contexto ativo."
      />
      <AutomationNav />
      <CommunicationDashboardWorkspace />
    </div>
  )
}
