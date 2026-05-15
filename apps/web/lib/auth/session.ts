import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

import {
  buildSessionPayload,
  type SessionPayload,
  toSessionUser,
  authenticateUser,
} from "@repo/auth"

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./constants"
import { getAuthSecret, sessionCookieOptions } from "./config"

export async function createSessionToken(user: ReturnType<typeof toSessionUser>) {
  const payload = buildSessionPayload(user)
  const secret = getAuthSecret()

  return new SignJWT({
    sub: payload.id,
    email: payload.email,
    name: payload.name,
    initials: payload.initials,
    role: payload.role,
    roleLabel: payload.roleLabel,
    organizationId: payload.organizationId,
    organizationName: payload.organizationName,
    title: payload.title,
    permissions: payload.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret)
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getAuthSecret()
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions)
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function loginWithCredentials(email: string, password: string) {
  const user = await authenticateUser(email, password)
  if (!user) return null
  const sessionUser = toSessionUser(user)
  const token = await createSessionToken(sessionUser)
  await setSessionCookie(token)
  return buildSessionPayload(sessionUser)
}
