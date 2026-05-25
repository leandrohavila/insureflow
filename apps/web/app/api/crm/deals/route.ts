import { NextResponse } from "next/server"

import { backendFetch, proxyBackendResponse } from "@/lib/api/backend"

export async function GET() {
  const response = await backendFetch("/api/v1/crm/deals")
  return proxyBackendResponse(response)
}

export async function POST(request: Request) {
  const body = await request.json()
  if (process.env.DEAL_CONTRACT_DEBUG === "1") {
    console.debug("[deal-contract][bff.post]", JSON.stringify(body))
  }
  const response = await backendFetch("/api/v1/crm/deals", {
    method: "POST",
    body: JSON.stringify(body),
  })

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  return proxyBackendResponse(response)
}
