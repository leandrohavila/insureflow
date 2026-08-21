import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET(request: Request) {
  const { search } = new URL(request.url)
  const response = await backendFetch(`/api/v1/opportunities${search}`)
  return proxyBackendResponse(response)
}

export async function POST(request: Request) {
  const body = await request.json()
  const response = await backendFetch("/api/v1/opportunities", {
    method: "POST",
    body: JSON.stringify(body),
  })
  return proxyBackendResponse(response)
}
