import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const response = await backendFetch(`/api/v1/users/${id}`, {}, request)
  return proxyBackendResponse(response)
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  const response = await backendFetch(
    `/api/v1/users/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
    request,
  )
  return proxyBackendResponse(response)
}
