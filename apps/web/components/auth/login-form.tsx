"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Loader2, Lock, Mail, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const demoAccounts = [
  { role: "Admin", email: "admin@insureflow.com", password: "Admin@2026!" },
  { role: "Visualizador", email: "viewer@insureflow.com", password: "Viewer@2026!" },
  { role: "Comercial", email: "sales@insureflow.com", password: "Sales@2026!" },
] as const

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reduce = useReducedMotion()
  const [email, setEmail] = useState("admin@insureflow.com")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const callbackUrl = searchParams.get("callbackUrl") ?? "/"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? "Falha ao entrar")
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError(
        "Não foi possível conectar à API. Confirme que a API está online em http://localhost:4000 (npm run dev na raiz)."
      )
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(account: (typeof demoAccounts)[number]) {
    setEmail(account.email)
    setPassword(account.password)
    setError(null)
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeOut }}
      className="w-full max-w-md"
    >
      <div className="mb-8 space-y-3 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.52_0.16_258)] shadow-xl shadow-primary/30 ring-1 ring-white/20">
          <Shield className="size-7 text-white" strokeWidth={1.25} />
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.04em]">
          <span className="text-gradient-brand">InsureFlow</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Autenticação enterprise com controle de acesso por perfil (RBAC)
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel space-y-5 rounded-2xl border border-white/[0.08] p-6 shadow-2xl md:p-8"
      >
        <motion.div className="space-y-2">
          <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
            E-mail corporativo
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border-white/[0.08] bg-white/[0.04] pl-10"
              placeholder="voce@empresa.com"
              required
            />
          </div>
        </motion.div>

        <motion.div className="space-y-2">
          <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
            Senha
          </label>
          <motion.div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-white/[0.08] bg-white/[0.04] pl-10"
              placeholder="••••••••"
              required
            />
          </motion.div>
        </motion.div>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}

        <Button type="submit" className="h-11 w-full shadow-lg shadow-primary/25" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Entrando…
            </>
          ) : (
            "Entrar no workspace"
          )}
        </Button>
      </form>

      <div className="mt-6 space-y-3">
        <p className="text-center text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Contas de demonstração
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemo(account)}
              className={cn(
                "rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left text-xs transition-colors",
                "hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <span className="font-semibold text-foreground">{account.role}</span>
              <span className="mt-0.5 block truncate text-muted-foreground">{account.email}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
