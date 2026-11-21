import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ shareId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { shareId } = await context.params
  const response = await backendFetch(
    `/api/v1/questionnaires/shares/${shareId}/revoke`,
    { method: "POST" },
  )
  return proxyBackendResponse(response)
}
