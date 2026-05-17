import { NextResponse } from "next/server"
import { z } from "zod"

import { loginWithBackendCredentials } from "@/lib/auth/session"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  tenantSlug: z.string().min(1).default("insureflow"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      )
    }

    const session = await loginWithBackendCredentials(
      parsed.data.email,
      parsed.data.password,
      parsed.data.tenantSlug
    )

    if (!session) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos" },
        { status: 401 }
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
  } catch {
    return NextResponse.json({ error: "Erro interno ao autenticar" }, { status: 500 })
  }
}
