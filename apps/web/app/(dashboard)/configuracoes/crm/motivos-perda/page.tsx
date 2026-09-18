import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { LeadLossReasonsManager } from "@/components/settings/lead-loss-reasons-manager"
import { SettingsNav } from "@/components/settings/settings-subnav"
import { requirePermission } from "@/lib/auth/guards"

export default async function LossReasonsSettingsPage() {
  await requirePermission("settings:view")

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <CrmPageHeader
        badge="CRM"
        title="Motivos de perda"
        description="Configure por que um lead é perdido e se ele entra na fila de reativação automática."
      />
      <SettingsNav />
      <LeadLossReasonsManager />
    </div>
  )
}
