import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const { id } = await params
  const response = await backendFetch(
    `/api/v1/commercial-reactivation-campaigns/${id}`,
    {},
    request,
  )
  return proxyBackendResponse(response)
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.text()
  const response = await backendFetch(
    `/api/v1/commercial-reactivation-campaigns/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    },
    request,
  )
  return proxyBackendResponse(response)
}
