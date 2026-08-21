import { RenewalsWorkspace } from "@/components/crm/renewals-workspace"
import { PageHeader } from "@/components/design-system"

export default function CrmRenewalsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <PageHeader
        compact
        title="Renovações"
        description="Fila comercial de apólices próximas do vencimento."
      />
      <RenewalsWorkspace />
    </div>
  )
}
