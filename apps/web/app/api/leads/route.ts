import { NextResponse } from "next/server"

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET(request: Request) {
  const { search } = new URL(request.url)
  const response = await backendFetch(`/api/v1/leads${search}`)
  return proxyBackendResponse(response)
}

export async function POST(request: Request) {
  const body = await request.json()
  const response = await backendFetch("/api/v1/leads", {
    method: "POST",
    body: JSON.stringify(body),
  })

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  return proxyBackendResponse(response)
}
