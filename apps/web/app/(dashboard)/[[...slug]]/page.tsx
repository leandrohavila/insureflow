import { forbidden, notFound } from "next/navigation"

import { DashboardHome } from "@/components/dashboard/dashboard-home"
import { SectionPlaceholder } from "@/components/dashboard/section-placeholder"
import { getNavTitle } from "@/lib/navigation"
import { getSession } from "@/lib/auth/session"
import { canAccessSegment } from "@/lib/auth/nav-access"

type PageProps = {
  params: Promise<{ slug?: string[] }>
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const first = slug?.[0] ?? ""
  const session = await getSession()

  if (!canAccessSegment(session, first)) {
    forbidden()
  }

  if (!first) {
    return <DashboardHome />
  }

  const title = getNavTitle(first)
  if (title === undefined) {
    notFound()
  }

  return <SectionPlaceholder title={title} />
}
