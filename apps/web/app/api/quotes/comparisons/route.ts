import { NextResponse } from "next/server"

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function POST(request: Request) {
  const body = await request.json()
  const response = await backendFetch("/api/v1/quotes/comparisons", {
    method: "POST",
    body: JSON.stringify(body),
  })

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  return proxyBackendResponse(response)
}
