import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"
import { sanitizePortalUpdateBody } from "@/lib/real-estate/portal-config-form"

export async function GET(request: Request) {
  const { search } = new URL(request.url)
  const response = await backendFetch(`/api/v1/portal-config${search}`, {}, request)
  return proxyBackendResponse(response)
}

export async function PUT(request: Request) {
  const body = sanitizePortalUpdateBody(await request.json())
  const response = await backendFetch(
    "/api/v1/portal-config",
    { method: "PUT", body: JSON.stringify(body) },
    request,
  )
  return proxyBackendResponse(response)
}
