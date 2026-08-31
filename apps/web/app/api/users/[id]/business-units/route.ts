import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  const response = await backendFetch(
    `/api/v1/users/${id}/business-units`,
    { method: "PUT", body: JSON.stringify(body) },
    request,
  )
  return proxyBackendResponse(response)
}
