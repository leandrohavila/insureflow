import { PortalManagementPage } from "@/components/real-estate/portal-management-page"
import { requirePermission } from "@/lib/auth/guards"
import { getPortalOrigin } from "@/lib/real-estate/portal-origin"

export const dynamic = "force-dynamic"

export default async function RealEstatePortalRoute() {
  await requirePermission("properties:view")
  return <PortalManagementPage portalOrigin={getPortalOrigin()} />
}
