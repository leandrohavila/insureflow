import { OwnersPage } from "@/components/real-estate/owners-page"
import { requirePermission } from "@/lib/auth/guards"

export default async function RealEstateOwnersRoute() {
  await requirePermission("properties:view")
  return <OwnersPage />
}
