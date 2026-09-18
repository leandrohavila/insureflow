import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET(request: Request) {
  const { search } = new URL(request.url)
  const response = await backendFetch(`/api/v1/properties${search}`, {}, request)
  return proxyBackendResponse(response)
}

export async function POST(request: Request) {
  const body = await request.json()
  const response = await backendFetch(
    "/api/v1/properties",
    { method: "POST", body: JSON.stringify(body) },
    request,
  )
  return proxyBackendResponse(response)
}
