import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { BusinessUnitsManager } from "@/components/settings/business-units-manager"
import { SettingsNav } from "@/components/settings/settings-subnav"
import { requirePermission } from "@/lib/auth/guards"

export default async function BusinessUnitsSettingsPage() {
  await requirePermission("settings:view")

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <CrmPageHeader
        badge="Multiempresa"
        title="Unidades de negócio"
        description="Cadastre a corretora, a imobiliária e futuras empresas do grupo sem duplicar leads ou clientes."
      />
      <SettingsNav />
      <BusinessUnitsManager />
    </div>
  )
}
