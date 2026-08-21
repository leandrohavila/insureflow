import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const response = await backendFetch(`/api/v1/customers/${id}/360/generate`, {
    method: "POST",
  })
  return proxyBackendResponse(response)
}
