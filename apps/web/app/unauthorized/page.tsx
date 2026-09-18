import Link from "next/link"
import { ShieldOff } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { getSession } from "@/lib/auth/session"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function UnauthorizedPage() {
  const session = await getSession()

  return (
    <div className="insure-main-surface flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <div className="glass-panel max-w-md space-y-6 rounded-2xl border border-white/[0.08] p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-500/15 ring-1 ring-rose-500/30">
          <ShieldOff className="size-7 text-rose-300" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-[-0.03em]">Acesso negado</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Seu perfil
            {session ? (
              <>
                {" "}
                <strong className="text-foreground">{session.roleLabel}</strong>
              </>
            ) : null}{" "}
            não possui permissão para este recurso.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
            Ir ao dashboard
          </Link>
          <Link
            href="/configuracoes"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Configurações
          </Link>
        </div>
      </div>
    </div>
  )
}
