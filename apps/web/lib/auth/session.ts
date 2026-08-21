import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

import {
  buildSessionPayload,
  type AppRole,
  type DataScope,
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
    dataScope?: DataScope
    teamIds?: string[]
    currentBusinessUnitId?: string | null
  }
}

const API_ROLE_TO_APP_ROLE: Record<string, AppRole> = {
  admin: "admin",
  gerencia: "gerencia",
  comercial: "comercial",
  operacional: "operacional",
  financeiro: "financeiro",
  parceiro: "parceiro",
  leitura: "leitura",
  sales: "sales",
  broker: "broker",
  underwriter: "underwriter",
  viewer: "viewer",
}

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  gerencia: "Gerência",
  comercial: "Comercial",
  operacional: "Operacional",
  financeiro: "Financeiro",
  parceiro: "Parceiro",
  leitura: "Leitura",
  sales: "Comercial",
  broker: "Corretor",
  underwriter: "Subscritor",
  viewer: "Visualizador",
}

function getApiBaseUrl() {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.API_URL ??
    "http://localhost:4000"
  )
}

function sanitizeLoginPayload(payload: {
  email: string
  password: string
  tenantSlug: string
}) {
  return { ...payload, password: "[REDACTED]" }
}

function headersToObject(headers: Headers) {
  return Object.fromEntries(headers.entries())
}

function redactBackendLoginBody(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map(redactBackendLoginBody)
  const record = { ...(value as Record<string, unknown>) }
  if ("accessToken" in record) record.accessToken = "[REDACTED]"
  if ("refreshToken" in record) record.refreshToken = "[REDACTED]"
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [
      key,
      redactBackendLoginBody(item),
    ]),
  )
}

function initialsFromEmail(email: string) {
  const [local = ""] = email.split("@")
  return (
    local
      .split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "IF"
  )
}

function toBackendSessionUser(
  payload: BackendLoginResponse["user"],
): SessionUser {
  const firstRole = payload.roles[0] ?? "viewer"
  const role = API_ROLE_TO_APP_ROLE[firstRole] ?? "viewer"
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.email.split("@")[0] ?? payload.email,
    initials: initialsFromEmail(payload.email),
    role,
    roleLabel: ROLE_LABELS[role],
    organizationId: payload.tenantId,
    organizationName: payload.tenantSlug,
    title: "InsureFlow",
  }
}

export async function createSessionToken(
  user: ReturnType<typeof toSessionUser>,
  options?: {
    permissions?: Permission[]
    dataScope?: DataScope
    teamIds?: string[]
    currentBusinessUnitId?: string | null
  },
) {
  const payload = buildSessionPayload(user)
  if (options?.permissions) {
    payload.permissions = options.permissions
  }
  if (options?.dataScope) {
    payload.dataScope = options.dataScope
  }
  if (options?.teamIds) {
    payload.teamIds = options.teamIds
  }
  if (options?.currentBusinessUnitId !== undefined) {
    payload.currentBusinessUnitId = options.currentBusinessUnitId
  }
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
    dataScope: payload.dataScope,
    teamIds: payload.teamIds,
    currentBusinessUnitId: payload.currentBusinessUnitId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret)
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const secret = getAuthSecret()
    const { payload } = await jwtVerify(token, secret)
    const session = payload as unknown as SessionPayload & { sub?: string }
    if (!session.id && session.sub) {
      session.id = session.sub
    }
    return session
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
  cookieStore.set(
    API_ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    sessionCookieOptions,
  )
  cookieStore.set(
    API_REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    sessionCookieOptions,
  )
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
  const apiBaseUrl = getApiBaseUrl()
  const url = `${apiBaseUrl}/api/v1/auth/login`
  const payload = { email, password, tenantSlug }
  console.info("[BUG011.1][loginWithBackendCredentials] request", {
    url,
    payload: sanitizeLoginPayload(payload),
    API_INTERNAL_URL: process.env.API_INTERNAL_URL ?? null,
    API_URL: process.env.API_URL ?? null,
  })

  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
  } catch (error) {
    console.error("[BUG011.1][loginWithBackendCredentials] fetch error", {
      url,
      originalError: error,
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }

  const responseText = await res
    .clone()
    .text()
    .catch((error) => {
      console.error(
        "[BUG011.1][loginWithBackendCredentials] response.text error",
        {
          originalError: error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      )
      return null
    })
  const responseJson = await res
    .clone()
    .json()
    .catch((error) => {
      console.error(
        "[BUG011.1][loginWithBackendCredentials] response.json error",
        {
          originalError: error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      )
      return null
    })

  console.info("[BUG011.1][loginWithBackendCredentials] response", {
    url,
    status: res.status,
    ok: res.ok,
    headers: headersToObject(res.headers),
    responseText: responseJson
      ? JSON.stringify(redactBackendLoginBody(responseJson))
      : responseText,
    responseJson: redactBackendLoginBody(responseJson),
  })

  if (!res.ok) return null

  const backend = responseJson as BackendLoginResponse
  const sessionUser = toBackendSessionUser(backend.user)
  const session = buildSessionPayload(sessionUser)
  session.permissions = backend.user.permissions as Permission[]
  session.dataScope = backend.user.dataScope
  session.teamIds = backend.user.teamIds
  session.currentBusinessUnitId = backend.user.currentBusinessUnitId
  const token = await createSessionToken(sessionUser, {
    permissions: session.permissions,
    dataScope: session.dataScope,
    teamIds: session.teamIds,
    currentBusinessUnitId: session.currentBusinessUnitId,
  })

  await setSessionCookie(token)
  await setBackendTokenCookies({
    accessToken: backend.accessToken,
    refreshToken: backend.refreshToken,
  })

  return session
}
