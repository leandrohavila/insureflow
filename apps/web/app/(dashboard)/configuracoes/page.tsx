import { PermissionsPanel } from "@/components/auth/permissions-panel"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { requirePermission } from "@/lib/auth/guards"

export default async function SettingsPage() {
  const session = await requirePermission("settings:view")

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <CrmPageHeader
        badge="Governança"
        title="Configurações"
        description="Perfil, organização e matriz de permissões RBAC do workspace."
      />
      <PermissionsPanel session={session} />
    </div>
  )
}
