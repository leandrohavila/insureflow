import { CrossSellWorkspace } from "@/components/automation/cross-sell-workspace"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { AutomationNav } from "@/components/settings/settings-subnav"
import { requirePermission } from "@/lib/auth/guards"

export default async function CrossSellPage() {
  await requirePermission("automation:view")

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <CrmPageHeader
        badge="Automação"
        title="Cross-sell"
        description="Quem busca imóvel recebe sugestão de seguro residencial. Quem contratou auto recebe sugestão de vida."
      />
      <AutomationNav />
      <CrossSellWorkspace />
    </div>
  )
}
