import { CustomersPage } from "@/components/customers/customers-page"
import { requirePermission } from "@/lib/auth/guards"

export default async function CustomersRoute() {
  await requirePermission("clients:view")
  return <CustomersPage />
}
