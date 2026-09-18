import { GovernanceAuditWorkspace } from "@/components/governance/governance-audit"
import { GovernanceShell } from "@/components/governance/governance-shell"
import { requirePermission } from "@/lib/auth/guards"

export default async function GovernanceAuditPage() {
  const session = await requirePermission("settings:view")

  return (
    <GovernanceShell
      title="Auditoria"
      description="Trilha de eventos sensíveis do tenant."
    >
      <GovernanceAuditWorkspace session={session} />
    </GovernanceShell>
  )
}
