import { NextResponse } from "next/server"

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET(request: Request) {
  const routeStartedAt = Date.now()
  const { search } = new URL(request.url)
  const traceId = request.headers.get("x-bug010-trace") ?? "lead-list"

  console.info("[BUG010.2][bff] GET /leads início", { traceId, search })
  const backendStartedAt = Date.now()
  const response = await backendFetch(`/api/v1/leads${search}`, {}, request)
  const backendFinishedAt = Date.now()
  console.info("[BUG010.2][bff] backend response", {
    traceId,
    backendMs: backendFinishedAt - backendStartedAt,
    status: response.status,
  })

  const bodyStartedAt = Date.now()
  const text = await response.text()
  const bodyFinishedAt = Date.now()
  console.info("[BUG010.2][bff] backend body read", {
    traceId,
    bodyReadMs: bodyFinishedAt - bodyStartedAt,
    bytes: text.length,
    totalRouteMs: bodyFinishedAt - routeStartedAt,
  })

  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
  })
}

export async function POST(request: Request) {
  const routeStartedAt = Date.now()
  const idempotencyKey = request.headers.get("idempotency-key")
  const traceId = idempotencyKey ?? "lead-create"
  console.info("[BUG010][bff] request recebida", { traceId })

  const body = await request.json()
  const headers = new Headers()
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey)

  const backendStartedAt = Date.now()
  console.info("[BUG010][bff] chamada backend start", {
    traceId,
    sinceRequestMs: backendStartedAt - routeStartedAt,
  })
  const response = await backendFetch(
    "/api/v1/leads",

    {
      method: "POST",
      headers,

      body: JSON.stringify(body),
    },

    request,
  )
  const backendFinishedAt = Date.now()
  console.info("[BUG010][bff] resposta backend", {
    traceId,
    backendMs: backendFinishedAt - backendStartedAt,
    totalRouteMs: backendFinishedAt - routeStartedAt,
    status: response.status,
  })

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  return proxyBackendResponse(response)
}
