import { MessageTemplatesManager } from "@/components/automation/message-templates-manager"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { AutomationNav } from "@/components/settings/settings-subnav"
import { requirePermission } from "@/lib/auth/guards"

export default async function MessageTemplatesPage() {
  await requirePermission("automation:view")

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <CrmPageHeader
        badge="Automação"
        title="Templates de mensagem"
        description="Padronize o retorno comercial com variáveis {{nome}}, {{interesse}}, {{empresa}} e {{corretor}}."
      />
      <AutomationNav />
      <MessageTemplatesManager />
    </div>
  )
}
