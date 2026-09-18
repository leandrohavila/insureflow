import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const formData = await request.formData()
  const response = await backendFetch(
    `/api/v1/properties/${id}/images/upload`,
    { method: "POST", body: formData },
    request,
  )
  return proxyBackendResponse(response)
}
