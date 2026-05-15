import { forbidden, redirect } from "next/navigation"

import { hasPermission, type Permission } from "@repo/auth"

import { getSession } from "./session"

export async function requireSession() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}

export async function requirePermission(permission: Permission) {
  const session = await requireSession()
  if (!hasPermission(session, permission)) {
    forbidden()
  }
  return session
}
