import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

type Params = { params: Promise<{ id: string; campaignLeadId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id, campaignLeadId } = await params
  const body = await request.text()
  const response = await backendFetch(
    `/api/v1/commercial-reactivation-campaigns/${id}/leads/${campaignLeadId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    },
    request,
  )
  return proxyBackendResponse(response)
}

export async function DELETE(request: Request, { params }: Params) {
  const { id, campaignLeadId } = await params
  const response = await backendFetch(
    `/api/v1/commercial-reactivation-campaigns/${id}/leads/${campaignLeadId}`,
    { method: "DELETE" },
    request,
  )
  return proxyBackendResponse(response)
}
