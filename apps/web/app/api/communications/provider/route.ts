import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET(request: Request) {
  const response = await backendFetch(
    "/api/v1/communications/provider",
    {},
    request,
  )
  return proxyBackendResponse(response)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const response = await backendFetch(
    "/api/v1/communications/provider",
    { method: "PATCH", body: JSON.stringify(body) },
    request,
  )
  return proxyBackendResponse(response)
}
