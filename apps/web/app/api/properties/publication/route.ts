import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function POST(request: Request) {
  const body = await request.json()
  const response = await backendFetch(
    "/api/v1/properties/publication",
    { method: "POST", body: JSON.stringify(body) },
    request,
  )
  return proxyBackendResponse(response)
}
