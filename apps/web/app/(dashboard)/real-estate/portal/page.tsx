import { PortalManagementPage } from "@/components/real-estate/portal-management-page"
import { requirePermission } from "@/lib/auth/guards"

export default async function RealEstatePortalRoute() {
  await requirePermission("properties:view")
  return <PortalManagementPage />
}
