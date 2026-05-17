import { cookies } from "next/headers"

import {
  API_ACCESS_TOKEN_COOKIE,
  API_REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants"
import { sessionCookieOptions } from "@/lib/auth/config"

export function getBackendApiBaseUrl() {
  return process.env.API_INTERNAL_URL ?? process.env.API_URL ?? "http://localhost:4000"
}

async function getAccessToken() {
  const cookieStore = await cookies()
  return cookieStore.get(API_ACCESS_TOKEN_COOKIE)?.value
}

async function refreshAccessToken() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(API_REFRESH_TOKEN_COOKIE)?.value
  if (!refreshToken) return null

  const response = await fetch(`${getBackendApiBaseUrl()}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  })

  if (!response.ok) {
    cookieStore.delete(API_ACCESS_TOKEN_COOKIE)
    cookieStore.delete(API_REFRESH_TOKEN_COOKIE)
    return null
  }

  const data = (await response.json()) as { accessToken?: string }
  if (!data.accessToken) return null

  cookieStore.set(API_ACCESS_TOKEN_COOKIE, data.accessToken, sessionCookieOptions)
  return data.accessToken
}

function buildBackendRequestInit(init: RequestInit, accessToken: string): RequestInit {
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${accessToken}`)
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return {
    ...init,
    headers,
    cache: "no-store",
  }
}

function fetchBackendWithToken(path: string, init: RequestInit, accessToken: string) {
  return fetch(
    `${getBackendApiBaseUrl()}${path}`,
    buildBackendRequestInit(init, accessToken)
  )
}

export async function clearBackendTokens() {
  const cookieStore = await cookies()
  cookieStore.delete(API_ACCESS_TOKEN_COOKIE)
  cookieStore.delete(API_REFRESH_TOKEN_COOKIE)
}

export async function backendFetch(path: string, init: RequestInit = {}) {
  const accessToken = (await getAccessToken()) ?? (await refreshAccessToken())
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const response = await fetchBackendWithToken(path, init, accessToken)
  if (response.status !== 401) return response

  const refreshedAccessToken = await refreshAccessToken()
  if (!refreshedAccessToken) return response

  return fetchBackendWithToken(path, init, refreshedAccessToken)
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
