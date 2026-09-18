import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ comparisonId: string; proposalId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { comparisonId, proposalId } = await context.params
  const response = await backendFetch(
    `/api/v1/quotes/comparisons/${comparisonId}/proposals/${proposalId}/expire`,
    { method: "POST" },
  )
  return proxyBackendResponse(response)
}
