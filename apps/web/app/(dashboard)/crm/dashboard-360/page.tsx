import { Dashboard360Workspace } from "@/components/crm/dashboard-360-workspace"
import { PageHeader } from "@/components/design-system"

export default function CrmDashboard360Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <PageHeader
        compact
        title="Dashboard 360"
        description="Clientes, receita prevista, renovação, cross-sell e conversão por empresa e corretor."
      />
      <Dashboard360Workspace />
    </div>
  )
}
