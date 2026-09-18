import { cookies } from "next/headers"

import {
  API_ACCESS_TOKEN_COOKIE,
  API_REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants"
import { sessionCookieOptions } from "@/lib/auth/config"

export function getBackendApiBaseUrl() {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.API_URL ??
    "http://localhost:4000"
  )
}

function readCookieFromHeader(
  cookieHeader: string | null | undefined,
  name: string,
) {
  if (!cookieHeader) return undefined

  for (const segment of cookieHeader.split(";")) {
    const trimmed = segment.trim()
    if (!trimmed) continue

    const separator = trimmed.indexOf("=")
    if (separator <= 0) continue

    const key = trimmed.slice(0, separator)
    const value = trimmed.slice(separator + 1)
    if (key !== name) continue

    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }

  return undefined
}

function readBearerFromRequest(request?: Request) {
  const authorization = request?.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return undefined

  const token = authorization.slice("Bearer ".length).trim()
  return token || undefined
}

async function getAccessToken(request?: Request) {
  const cookieStore = await cookies()
  const fromStore = cookieStore.get(API_ACCESS_TOKEN_COOKIE)?.value
  if (fromStore) return fromStore

  const fromRequestCookie = readCookieFromHeader(
    request?.headers.get("cookie"),
    API_ACCESS_TOKEN_COOKIE,
  )
  if (fromRequestCookie) return fromRequestCookie

  return readBearerFromRequest(request)
}

async function getRefreshToken(request?: Request) {
  const cookieStore = await cookies()
  const fromStore = cookieStore.get(API_REFRESH_TOKEN_COOKIE)?.value
  if (fromStore) return fromStore

  return readCookieFromHeader(
    request?.headers.get("cookie"),
    API_REFRESH_TOKEN_COOKIE,
  )
}

async function refreshAccessToken(request?: Request) {
  const cookieStore = await cookies()
  const refreshToken = await getRefreshToken(request)
  if (!refreshToken) return null

  const response = await fetch(
    `${getBackendApiBaseUrl()}/api/v1/auth/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    },
  )

  if (!response.ok) {
    cookieStore.delete(API_ACCESS_TOKEN_COOKIE)
    cookieStore.delete(API_REFRESH_TOKEN_COOKIE)
    return null
  }

  const data = (await response.json()) as { accessToken?: string }
  if (!data.accessToken) return null

  cookieStore.set(
    API_ACCESS_TOKEN_COOKIE,
    data.accessToken,
    sessionCookieOptions,
  )
  return data.accessToken
}

function buildBackendRequestInit(
  init: RequestInit,
  accessToken: string,
): RequestInit {
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${accessToken}`)
  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(typeof FormData !== "undefined" && init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json")
  }

  return {
    ...init,
    headers,
    cache: "no-store",
  }
}

function fetchBackendWithToken(
  path: string,
  init: RequestInit,
  accessToken: string,
) {
  return fetch(
    `${getBackendApiBaseUrl()}${path}`,
    buildBackendRequestInit(init, accessToken),
  )
}

function sanitizeBackendBody(body: BodyInit | null | undefined) {
  if (typeof body !== "string") return body ? "[non-string-body]" : null
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>
    if ("password" in parsed) parsed.password = "[REDACTED]"
    if ("refreshToken" in parsed) parsed.refreshToken = "[REDACTED]"
    return parsed
  } catch {
    return body
  }
}

export async function clearBackendTokens() {
  const cookieStore = await cookies()
  cookieStore.delete(API_ACCESS_TOKEN_COOKIE)
  cookieStore.delete(API_REFRESH_TOKEN_COOKIE)
}

export async function backendFetch(
  path: string,
  init: RequestInit = {},
  request?: Request,
) {
  const url = `${getBackendApiBaseUrl()}${path}`
  console.info("[BUG011.1][backendFetch] request", {
    url,
    method: init.method ?? "GET",
    payload: sanitizeBackendBody(init.body),
    API_INTERNAL_URL: process.env.API_INTERNAL_URL ?? null,
    API_URL: process.env.API_URL ?? null,
  })
  const accessToken =
    (await getAccessToken(request)) ?? (await refreshAccessToken(request))
  if (!accessToken) {
    console.info("[BUG011.1][backendFetch] no access token", { url })
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const response = await fetchBackendWithToken(path, init, accessToken)
  console.info("[BUG011.1][backendFetch] response", {
    url,
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  })
  if (response.status !== 401) return response

  const refreshedAccessToken = await refreshAccessToken(request)
  if (!refreshedAccessToken) return response

  const retryResponse = await fetchBackendWithToken(
    path,
    init,
    refreshedAccessToken,
  )
  console.info("[BUG011.1][backendFetch] retry response", {
    url,
    status: retryResponse.status,
    headers: Object.fromEntries(retryResponse.headers.entries()),
  })
  return retryResponse
}

export async function proxyBackendResponse(response: Response) {
  const text = await response.text()
  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
  })
}

export async function proxyBackendBinary(response: Response) {
  const buffer = await response.arrayBuffer()
  const headers = new Headers()
  const contentType = response.headers.get("Content-Type")
  const disposition = response.headers.get("Content-Disposition")
  if (contentType) headers.set("Content-Type", contentType)
  if (disposition) headers.set("Content-Disposition", disposition)
  return new Response(buffer, { status: response.status, headers })
}
