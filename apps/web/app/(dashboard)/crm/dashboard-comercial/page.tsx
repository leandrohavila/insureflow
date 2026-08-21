import { CommercialDashboardWorkspace } from "@/components/crm/commercial-dashboard-workspace"
import { PageHeader } from "@/components/design-system"

export default function CrmCommercialDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <PageHeader
        compact
        title="Dashboard comercial"
        description="Recuperação de leads, follow-ups e renovações por período e unidade."
      />
      <CommercialDashboardWorkspace />
    </div>
  )
}
