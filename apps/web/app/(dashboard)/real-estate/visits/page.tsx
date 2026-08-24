import { VisitsPage } from "@/components/real-estate/visits-page"
import { requirePermission } from "@/lib/auth/guards"

export default async function RealEstateVisitsRoute() {
  await requirePermission("properties:view")
  return <VisitsPage />
}
