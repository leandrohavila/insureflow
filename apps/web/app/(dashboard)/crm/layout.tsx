import "@/app/crm-operational.css"

import { CrmShell } from "@/components/crm/crm-shell"
import { requirePermission } from "@/lib/auth/guards"

export const dynamic = "force-dynamic"

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("crm:view")
  return <CrmShell>{children}</CrmShell>
}
