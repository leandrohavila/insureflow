import { GovernanceOverview } from "@/components/governance/governance-overview"
import { GovernanceShell } from "@/components/governance/governance-shell"
import { requirePermission } from "@/lib/auth/guards"

export default async function GovernanceOverviewPage() {
  const session = await requirePermission("settings:view")

  return (
    <GovernanceShell
      title="Visão Geral"
      description="Resumo do seu acesso, empresas do Grupo Ávila e canais de aquisição."
    >
      <GovernanceOverview session={session} />
    </GovernanceShell>
  )
}
