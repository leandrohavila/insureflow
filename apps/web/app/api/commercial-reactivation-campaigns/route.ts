import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET(request: Request) {
  const { search } = new URL(request.url)
  const response = await backendFetch(
    `/api/v1/commercial-reactivation-campaigns${search}`,
    {},
    request,
  )
  return proxyBackendResponse(response)
}

export async function POST(request: Request) {
  const body = await request.text()
  const response = await backendFetch(
    `/api/v1/commercial-reactivation-campaigns`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
    request,
  )
  return proxyBackendResponse(response)
}
