import { NextResponse } from "next/server"

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ comparisonId: string; proposalId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { comparisonId, proposalId } = await context.params
  const body = await request.json()
  const response = await backendFetch(
    `/api/v1/quotes/comparisons/${comparisonId}/proposals/${proposalId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  )

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  return proxyBackendResponse(response)
}
