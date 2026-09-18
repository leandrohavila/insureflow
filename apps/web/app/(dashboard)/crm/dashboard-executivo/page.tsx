import { ExecutiveDashboardWorkspace } from "@/components/crm/executive-dashboard-workspace"
import { PageHeader } from "@/components/design-system"

export default function CrmExecutiveDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <PageHeader
        compact
        title="Dashboard executivo"
        description="Funil único da Corretora e da Imobiliária — conversão, receita e produtividade."
      />
      <ExecutiveDashboardWorkspace />
    </div>
  )
}
