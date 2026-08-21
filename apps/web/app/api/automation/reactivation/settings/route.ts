import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET(request: Request) {
  const response = await backendFetch(
    "/api/v1/automation/reactivation/settings",
    {},
    request,
  )
  return proxyBackendResponse(response)
}

export async function POST(request: Request) {
  const body = await request.json()
  const response = await backendFetch(
    "/api/v1/automation/reactivation/settings",
    { method: "POST", body: JSON.stringify(body) },
    request,
  )
  return proxyBackendResponse(response)
}
