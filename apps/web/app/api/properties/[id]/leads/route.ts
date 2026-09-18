import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const response = await backendFetch(
    `/api/v1/properties/${id}/leads`,
    {},
    request,
  )
  return proxyBackendResponse(response)
}
