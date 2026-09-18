import { PropertiesPage } from "@/components/real-estate/properties-page"
import { requirePermission } from "@/lib/auth/guards"

export default async function RealEstatePropertiesRoute() {
  await requirePermission("properties:view")
  return <PropertiesPage />
}
