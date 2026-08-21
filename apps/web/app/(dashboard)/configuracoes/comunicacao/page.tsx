import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { SettingsNav } from "@/components/settings/settings-subnav"
import { WhatsAppBusinessSettings } from "@/components/settings/whatsapp-business-settings"
import { requirePermission } from "@/lib/auth/guards"

export default async function CommunicationSettingsPage() {
  await requirePermission("settings:view")

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <CrmPageHeader
        badge="Comunicação"
        title="WhatsApp Business"
        description="Configure a Evolution API para envio e recebimento reais de WhatsApp."
      />
      <SettingsNav />
      <WhatsAppBusinessSettings />
    </div>
  )
}
