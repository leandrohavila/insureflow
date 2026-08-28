import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"
import { API_ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants"
import { sessionCookieOptions } from "@/lib/auth/config"
import {
  createSessionToken,
  getSession,
  setSessionCookie,
} from "@/lib/auth/session"
import type { DataScope, Permission } from "@repo/auth"

type ContextResponse = {
  currentBusinessUnitId: string | null
  canViewAll: boolean
  canManage: boolean
  units: unknown[]
  accessToken?: string
  user?: {
    permissions: Permission[]
    dataScope?: DataScope
    teamIds?: string[]
    currentBusinessUnitId?: string | null
  }
}

export async function GET(request: Request) {
  const response = await backendFetch(
    "/api/v1/business-units/context",
    {},
    request,
  )
  return proxyBackendResponse(response)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const response = await backendFetch(
    "/api/v1/business-units/context",
    { method: "PATCH", body: JSON.stringify(body) },
    request,
  )

  const text = await response.text()
  if (!response.ok) {
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    })
  }

  const payload = JSON.parse(text) as ContextResponse

  if (payload.accessToken) {
    const cookieStore = await cookies()
    cookieStore.set(
      API_ACCESS_TOKEN_COOKIE,
      payload.accessToken,
      sessionCookieOptions,
    )
  }

  const session = await getSession()
  if (session) {
    const token = await createSessionToken(
      {
        id: session.id,
        email: session.email,
        name: session.name,
        initials: session.initials,
        role: session.role,
        roleLabel: session.roleLabel,
        organizationId: session.organizationId,
        organizationName: session.organizationName,
        title: session.title,
      },
      {
        permissions: payload.user?.permissions ?? session.permissions,
        dataScope: payload.user?.dataScope ?? session.dataScope,
        teamIds: payload.user?.teamIds ?? session.teamIds,
        currentBusinessUnitId:
          payload.user?.currentBusinessUnitId ??
          payload.currentBusinessUnitId ??
          null,
        roles: session.roles ?? [session.role],
      },
    )
    await setSessionCookie(token)
  }

  return NextResponse.json({
    currentBusinessUnitId: payload.currentBusinessUnitId,
    canViewAll: payload.canViewAll,
    canManage: payload.canManage,
    units: payload.units,
  })
}
