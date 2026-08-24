import { PropertyForm } from "@/components/real-estate/property-form"
import { requirePermission } from "@/lib/auth/guards"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditPropertyRoute({ params }: PageProps) {
  await requirePermission("properties:view")
  const { id } = await params
  return <PropertyForm propertyId={id} />
}
