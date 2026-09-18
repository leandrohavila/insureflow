import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ comparisonId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { comparisonId } = await context.params
  const response = await backendFetch(
    `/api/v1/quotes/comparisons/${comparisonId}/viewed`,
    { method: "POST" },
  )
  return proxyBackendResponse(response)
}
