import { PropertyLeadsPage } from "@/components/real-estate/property-leads-page"
import { requirePermission } from "@/lib/auth/guards"

export default async function RealEstateLeadsRoute() {
  await requirePermission("properties:view")
  return <PropertyLeadsPage />
}
