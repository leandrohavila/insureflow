"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Loader2, Lock, Mail } from "lucide-react"

import { PoweredByInsureFlow } from "@/components/branding/powered-by-insureflow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const demoAccounts = [
  { role: "Admin", email: "admin@insureflow.com", password: "Admin@2026!" },
  { role: "Gerência", email: "gerencia@insureflow.com", password: "Gerencia@2026!" },
  { role: "Comercial", email: "comercial@insureflow.com", password: "Comercial@2026!" },
  { role: "Parceiro", email: "parceiro@insureflow.com", password: "Parceiro@2026!" },
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
        "Não foi possível conectar à API. Confirme que a API está online em http://localhost:4000 (npm run dev na raiz).",
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
      <div className="mb-8 space-y-2">
        <h1 className="font-serif text-2xl font-semibold tracking-[-0.03em] text-[#10294B] dark:text-[#F6F1E8]">
          Entrar
        </h1>
        <p className="text-sm text-muted-foreground">
          Corretora e Imóveis no mesmo tenant operacional.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-[#d6cfc4] bg-white p-6 shadow-lg dark:border-white/[0.08] dark:bg-[#10294B] md:p-8"
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
              className="h-11 border-[#d6cfc4] bg-[#f6f1e8]/50 pl-10 dark:border-white/[0.08] dark:bg-white/[0.04]"
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
              className="h-11 border-[#d6cfc4] bg-[#f6f1e8]/50 pl-10 dark:border-white/[0.08] dark:bg-white/[0.04]"
              placeholder="••••••••"
              required
            />
          </motion.div>
        </motion.div>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="h-11 w-full bg-[#10294B] text-[#F6F1E8] shadow-md hover:bg-[#000C24] dark:bg-[#C09048] dark:text-[#000C24] dark:hover:bg-[#DEAE5D]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Entrando…
            </>
          ) : (
            "Entrar no workspace"
          )}
        </Button>

        <PoweredByInsureFlow className="pt-1 text-center text-muted-foreground/70" />
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
                "rounded-xl border border-[#d6cfc4] bg-white px-3 py-2.5 text-left text-xs transition-colors",
                "hover:border-[#C09048]/40 hover:bg-[#C09048]/5",
                "dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-[#C09048]/30",
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
