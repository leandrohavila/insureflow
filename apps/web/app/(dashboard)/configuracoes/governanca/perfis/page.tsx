import { GovernanceProfilesWorkspace } from "@/components/governance/governance-profiles"
import { GovernanceShell } from "@/components/governance/governance-shell"
import { requirePermission } from "@/lib/auth/guards"

export default async function GovernanceProfilesPage() {
  await requirePermission("settings:view")

  return (
    <GovernanceShell
      title="Perfis"
      description="Perfis RBAC agrupados por domínio, com escopo por empresa do Grupo Ávila."
    >
      <GovernanceProfilesWorkspace />
    </GovernanceShell>
  )
}
