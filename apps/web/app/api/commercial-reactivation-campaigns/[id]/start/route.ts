import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type Params = { params: Promise<{ id: string }> }

async function postAction(request: Request, id: string, action: string) {
  const body = await request.text()
  const response = await backendFetch(
    `/api/v1/commercial-reactivation-campaigns/${id}/${action}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body || "{}",
    },
    request,
  )
  return proxyBackendResponse(response)
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  return postAction(request, id, "start")
}
