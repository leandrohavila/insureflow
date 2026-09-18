import { NextResponse } from "next/server"

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ comparisonId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { comparisonId } = await context.params
  const body = await request.json()
  const response = await backendFetch(
    `/api/v1/quotes/comparisons/${comparisonId}/quotes`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  )

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  return proxyBackendResponse(response)
}
