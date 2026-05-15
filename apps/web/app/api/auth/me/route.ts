import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  return NextResponse.json({
    id: session.id,
    email: session.email,
    name: session.name,
    initials: session.initials,
    role: session.role,
    roleLabel: session.roleLabel,
    organizationId: session.organizationId,
    organizationName: session.organizationName,
    title: session.title,
    permissions: session.permissions,
  })
}
