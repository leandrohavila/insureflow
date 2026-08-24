import { PropertyForm } from "@/components/real-estate/property-form"
import { requirePermission } from "@/lib/auth/guards"

export default async function NewPropertyRoute() {
  await requirePermission("properties:manage")
  return <PropertyForm />
}
