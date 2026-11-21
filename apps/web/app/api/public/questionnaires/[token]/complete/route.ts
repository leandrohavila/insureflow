import { proxyPublicBackend } from "@/lib/api/public-backend"

type RouteContext = {
  params: Promise<{ token: string }>
}

const PUBLIC_TOKEN = /^[A-Za-z0-9_-]{32,128}$/

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params
  if (!PUBLIC_TOKEN.test(token)) {
    return new Response(
      JSON.stringify({ message: "Link inválido ou expirado." }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    )
  }
  const body = await request.text()
  return proxyPublicBackend(`/api/v1/public/questionnaires/${token}/complete`, {
    method: "POST",
    body,
  })
}
