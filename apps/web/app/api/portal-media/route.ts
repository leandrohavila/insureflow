import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function POST(request: Request) {
  const formData = await request.formData()
  const response = await backendFetch(
    "/api/v1/portal-media",
    { method: "POST", body: formData },
    request,
  )
  return proxyBackendResponse(response)
}
