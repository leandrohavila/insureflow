import { Customer360Workspace } from "@/components/crm/customer-360-workspace"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Customer360Page({ params }: PageProps) {
  const { id } = await params
  return <Customer360Workspace customerId={id} />
}
