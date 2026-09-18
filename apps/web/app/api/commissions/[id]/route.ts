import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  const response = await backendFetch(`/api/v1/commissions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, request)
  return proxyBackendResponse(response)
}
