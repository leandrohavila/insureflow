import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ comparisonId: string; quoteId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { comparisonId, quoteId } = await context.params
  const response = await backendFetch(
    `/api/v1/quotes/comparisons/${comparisonId}/quotes/${quoteId}/select`,
    { method: "POST" },
  )
  return proxyBackendResponse(response)
}
