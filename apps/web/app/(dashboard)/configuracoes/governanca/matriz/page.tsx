import { GovernanceMatrixWorkspace } from "@/components/governance/governance-matrix"
import { GovernanceShell } from "@/components/governance/governance-shell"
import { requirePermission } from "@/lib/auth/guards"

export default async function GovernanceMatrixPage() {
  await requirePermission("settings:view")

  return (
    <GovernanceShell
      title="Matriz de Permissões"
      description="Visão cruzada perfil × permissão por domínio de negócio."
    >
      <GovernanceMatrixWorkspace />
    </GovernanceShell>
  )
}
