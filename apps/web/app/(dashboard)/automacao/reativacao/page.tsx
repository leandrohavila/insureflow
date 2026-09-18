import { LeadReactivationWorkspace } from "@/components/automation/lead-reactivation-workspace"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { AutomationNav } from "@/components/settings/settings-subnav"
import { requirePermission } from "@/lib/auth/guards"

export default async function ReactivationPage() {
  await requirePermission("automation:view")

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <CrmPageHeader
        badge="Automação"
        title="Reativação de leads"
        description="Leads perdidos voltam para a fila após o período sem contato, com mensagem automática e histórico na timeline."
      />
      <AutomationNav />
      <LeadReactivationWorkspace />
    </div>
  )
}
