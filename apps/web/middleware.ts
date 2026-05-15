import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

import {
  getRoutePermission,
  hasPermission,
  isPublicPath,
  type SessionPayload,
} from "@repo/auth"

import { SESSION_COOKIE } from "@/lib/auth/constants"

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    return new TextEncoder().encode("insureflow-dev-secret-change-in-production-32ch")
  }
  return new TextEncoder().encode(secret)
}

async function readSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await readSession(request)

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  if (isPublicPath(pathname)) {
    if (session && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    const login = new URL("/login", request.url)
    login.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(login)
  }

  const required = getRoutePermission(pathname)
  if (required && !hasPermission(session, required)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  const response = NextResponse.next()
  response.headers.set("x-insureflow-user-id", session.id)
  response.headers.set("x-insureflow-role", session.role)
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
