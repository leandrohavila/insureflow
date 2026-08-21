import { SlaDashboardWorkspace } from "@/components/crm/sla-dashboard-workspace"
import { PageHeader } from "@/components/design-system"

export default function CrmSlaDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <PageHeader
        compact
        title="Dashboard de SLA"
        description="Nenhum negócio esquecido — alertas, atrasos e gargalos por corretor e empresa."
      />
      <SlaDashboardWorkspace />
    </div>
  )
}
