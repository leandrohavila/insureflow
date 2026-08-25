import { GovernanceCompaniesWorkspace } from "@/components/governance/governance-companies"
import { GovernanceShell } from "@/components/governance/governance-shell"
import { requirePermission } from "@/lib/auth/guards"

export default async function GovernanceCompaniesPage() {
  const session = await requirePermission("settings:view")

  return (
    <GovernanceShell
      title="Empresas"
      description="Corretora Ávila e Ávila Imóveis — escopo multiempresa e unidades cadastradas."
    >
      <GovernanceCompaniesWorkspace session={session} />
    </GovernanceShell>
  )
}
