import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { requireSession } from "@/lib/auth/guards"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireSession()
  return <DashboardShell session={session}>{children}</DashboardShell>
}
