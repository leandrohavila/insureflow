import { getBackendApiBaseUrl, proxyBackendResponse } from "@/lib/api/backend"

export async function proxyPublicBackend(path: string, init: RequestInit = {}) {
  try {
    const headers = new Headers(init.headers)
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
    const response = await fetch(`${getBackendApiBaseUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    })
    return proxyBackendResponse(response)
  } catch {
    return new Response(
      JSON.stringify({
        message: "Não foi possível abrir o questionário agora.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    )
  }
}
