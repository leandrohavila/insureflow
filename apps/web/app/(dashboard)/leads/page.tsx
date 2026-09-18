import { LeadsPage } from "@/components/leads/leads-page"
import { requirePermission } from "@/lib/auth/guards"

export default async function LeadsRoute() {
  await requirePermission("leads:view")
  return <LeadsPage />
}
