import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ proposalId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { proposalId } = await context.params
  const response = await backendFetch(`/api/v1/quotes/proposals/${proposalId}`)
  return proxyBackendResponse(response)
}
