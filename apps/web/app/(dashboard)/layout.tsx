import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { requireSession } from "@/lib/auth/guards"

/** Sessão via cookies — obrigatório em build/deploy cloud (Vercel/CI). */
export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireSession()
  return <DashboardShell session={session}>{children}</DashboardShell>
}
