import { PerformanceDashboardWorkspace } from "@/components/crm/performance-dashboard-workspace"
import { PageHeader } from "@/components/design-system"

export default function CrmPerformancePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <PageHeader
        compact
        title="Performance comercial"
        description="Metas, receita, comissões e ranking por corretor, equipe e empresa."
      />
      <PerformanceDashboardWorkspace />
    </div>
  )
}
