import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

import {
  buildSessionPayload,
  type AppRole,
  type Permission,
  type SessionUser,
  type SessionPayload,
  toSessionUser,
  authenticateUser,
} from "@repo/auth"

import {
  API_ACCESS_TOKEN_COOKIE,
  API_REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "./constants"
import { getAuthSecret, sessionCookieOptions } from "./config"

type BackendLoginResponse = {
  accessToken: string
  refreshToken: string
  expiresIn: string
  user: {
    sub: string
    email: string
    tenantId: string
    tenantSlug: string
    roles: string[]
    permissions: string[]
  }
}

const API_ROLE_TO_APP_ROLE: Record<string, AppRole> = {
  admin: "admin",
  broker: "broker",
  underwriter: "underwriter",
  viewer: "viewer",
}

function getApiBaseUrl() {
  return process.env.API_INTERNAL_URL ?? process.env.API_URL ?? "http://localhost:4000"
}

function initialsFromEmail(email: string) {
  const [local = ""] = email.split("@")
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "IF"
}

function toBackendSessionUser(payload: BackendLoginResponse["user"]): SessionUser {
  const firstRole = payload.roles[0] ?? "admin"
  const role = API_ROLE_TO_APP_ROLE[firstRole] ?? "admin"
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.email.split("@")[0] ?? payload.email,
    initials: initialsFromEmail(payload.email),
    role,
    roleLabel: role === "admin" ? "Administrador" : firstRole,
    organizationId: payload.tenantId,
    organizationName: payload.tenantSlug,
    title: "InsureFlow",
  }
}

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

export async function setBackendTokenCookies(tokens: {
  accessToken: string
  refreshToken: string
}) {
  const cookieStore = await cookies()
  cookieStore.set(API_ACCESS_TOKEN_COOKIE, tokens.accessToken, sessionCookieOptions)
  cookieStore.set(API_REFRESH_TOKEN_COOKIE, tokens.refreshToken, sessionCookieOptions)
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete(API_ACCESS_TOKEN_COOKIE)
  cookieStore.delete(API_REFRESH_TOKEN_COOKIE)
}

export async function loginWithCredentials(email: string, password: string) {
  const user = await authenticateUser(email, password)
  if (!user) return null
  const sessionUser = toSessionUser(user)
  const token = await createSessionToken(sessionUser)
  await setSessionCookie(token)
  return buildSessionPayload(sessionUser)
}

export async function loginWithBackendCredentials(
  email: string,
  password: string,
  tenantSlug = "insureflow",
) {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenantSlug }),
    cache: "no-store",
  })

  if (!res.ok) return null

  const backend = (await res.json()) as BackendLoginResponse
  const sessionUser = toBackendSessionUser(backend.user)
  const token = await createSessionToken(sessionUser)
  const session = buildSessionPayload(sessionUser)
  session.permissions = backend.user.permissions as Permission[]

  await setSessionCookie(token)
  await setBackendTokenCookies({
    accessToken: backend.accessToken,
    refreshToken: backend.refreshToken,
  })

  return session
}
