import { NextResponse } from "next/server"
import { z } from "zod"

import { loginWithBackendCredentials } from "@/lib/auth/session"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  tenantSlug: z.string().min(1).default("insureflow"),
})

function sanitizeLoginBody(body: unknown) {
  if (!body || typeof body !== "object") return body
  return { ...(body as Record<string, unknown>), password: "[REDACTED]" }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.info("[BUG011.1][BFF login route] request", {
      url: request.url,
      payload: sanitizeLoginBody(body),
      headers: Object.fromEntries(request.headers.entries()),
      API_INTERNAL_URL: process.env.API_INTERNAL_URL ?? null,
      API_URL: process.env.API_URL ?? null,
    })
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      )
    }

    const session = await loginWithBackendCredentials(
      parsed.data.email,
      parsed.data.password,
      parsed.data.tenantSlug,
    )

    if (!session) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos" },
        { status: 401 },
      )
    }

    return NextResponse.json({
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
        roleLabel: session.roleLabel,
        organizationName: session.organizationName,
      },
    })
  } catch (error) {
    console.error("[BUG011.1][BFF login route] error", {
      originalError: error,
      stack: error instanceof Error ? error.stack : undefined,
    })
    console.error("[LOGIN ERROR]", error)
    return NextResponse.json(
      { error: "Erro interno ao autenticar" },
      { status: 500 },
    )
  }
}
