import { NextResponse } from "next/server"

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ comparisonId: string; proposalId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { comparisonId, proposalId } = await context.params
  const response = await backendFetch(
    `/api/v1/quotes/comparisons/${comparisonId}/proposals/${proposalId}/pdf`,
  )

  if (!response.ok) {
    return proxyBackendResponse(response)
  }

  const buffer = await response.arrayBuffer()
  const disposition =
    response.headers.get("content-disposition") ??
    `attachment; filename="proposta-${proposalId}.pdf"`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
    },
  })
}
