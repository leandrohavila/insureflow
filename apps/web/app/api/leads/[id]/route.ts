import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const response = await backendFetch(`/api/v1/leads/${id}`)
  return proxyBackendResponse(response)
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await request.json()
  const response = await backendFetch(`/api/v1/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
  return proxyBackendResponse(response)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const response = await backendFetch(`/api/v1/leads/${id}`, {
    method: "DELETE",
  })
  return proxyBackendResponse(response)
}
