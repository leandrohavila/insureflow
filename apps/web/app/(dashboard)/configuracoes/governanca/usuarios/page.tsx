import { GovernanceUsersWorkspace } from "@/components/governance/governance-users"
import { GovernanceShell } from "@/components/governance/governance-shell"
import { requirePermission } from "@/lib/auth/guards"

export default async function GovernanceUsersPage() {
  const session = await requirePermission("settings:view")

  return (
    <GovernanceShell
      title="Usuários"
      description="Diretório de usuários do tenant — somente leitura (Fase 2A)."
    >
      <GovernanceUsersWorkspace session={session} />
    </GovernanceShell>
  )
}
