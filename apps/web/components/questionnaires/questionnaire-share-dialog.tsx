"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getErrorMessage } from "@/lib/data-access"
import {
  useCreateQuestionnaireShare,
  useQuestionnaireShares,
  useRevokeQuestionnaireShare,
  type QuestionnaireSubmission,
} from "@/lib/data-access/modules/questionnaires"
import { formatLeadDetailDate } from "@/lib/leads/lead-detail-view"
import {
  currentQuestionnaireShare,
  questionnaireCanShare,
  questionnairePublicPath,
  questionnaireShareStatusLabel,
} from "@/lib/questionnaires/questionnaire-share"

const EXPIRY_OPTIONS = [7, 14, 30] as const

type QuestionnaireShareDialogProps = {
  submission: QuestionnaireSubmission | null
  canManage: boolean
  onOpenChange: (open: boolean) => void
}

export function QuestionnaireShareDialog({
  submission,
  canManage,
  onOpenChange,
}: QuestionnaireShareDialogProps) {
  const submissionId = submission?.id ?? null
  const sharesQuery = useQuestionnaireShares(submissionId)
  const createShare = useCreateQuestionnaireShare()
  const revokeShare = useRevokeQuestionnaireShare(submissionId ?? "")
  const [days, setDays] = useState<(typeof EXPIRY_OPTIONS)[number]>(14)
  const [issuedUrl, setIssuedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shares = sharesQuery.data ?? []
  const current = currentQuestionnaireShare(shares)
  const canIssue = Boolean(submission && questionnaireCanShare(submission.status) && canManage)

  function close(open: boolean) {
    if (!open) {
      setIssuedUrl(null)
      setCopied(false)
      setError(null)
    }
    onOpenChange(open)
  }

  async function issue() {
    if (!submission) return
    setError(null)
    setCopied(false)
    try {
      const created = await createShare.mutateAsync({
        submissionId: submission.id,
        expiresInDays: days,
      })
      if (!created.token) {
        setIssuedUrl(null)
        setError("O link foi criado, mas o endereço não pôde ser exibido. Gere novamente.")
        return
      }
      const path = questionnairePublicPath(created.token)
      const origin = window.location.origin
      setIssuedUrl(`${origin}${path}`)
    } catch (cause) {
      setError(getErrorMessage(cause, "Não foi possível gerar o link."))
    }
  }

  async function copy() {
    if (!issuedUrl) return
    try {
      await navigator.clipboard.writeText(issuedUrl)
      setCopied(true)
    } catch {
      setCopied(false)
      setError("Não foi possível copiar. Selecione o endereço e copie manualmente.")
    }
  }

  async function revoke(shareId: string) {
    setError(null)
    try {
      await revokeShare.mutateAsync(shareId)
      setIssuedUrl(null)
    } catch (cause) {
      setError(getErrorMessage(cause, "Não foi possível revogar o link."))
    }
  }

  return (
    <Dialog open={Boolean(submission)} onOpenChange={close}>
      <DialogContent className="avila-crm-canvas max-h-[min(720px,calc(100dvh-1.5rem))] overflow-y-auto bg-[var(--avila-ivory)] text-[var(--avila-navy-900)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link do cliente</DialogTitle>
          <DialogDescription>
            O cliente preenche sem login. O endereço completo aparece só no momento da geração.
          </DialogDescription>
        </DialogHeader>

        {current ? (
          <p className="text-sm text-[var(--avila-navy-900)]">
            Link vigente até {formatLeadDetailDate(current.expiresAt) ?? "a data de expiração"}.
            {current.createdBy?.name ? ` Enviado por ${current.createdBy.name}.` : ""}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum link vigente.</p>
        )}

        {canIssue ? (
          <div className="space-y-3">
            {current ? (
              <p className="text-sm text-muted-foreground">
                Gerar outro link revoga o vigente. O endereço anterior deixa de abrir o questionário.
              </p>
            ) : null}
            <label className="block text-sm">
              <span className="text-muted-foreground">Validade</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2"
                value={days}
                onChange={(event) =>
                  setDays(Number(event.target.value) as (typeof EXPIRY_OPTIONS)[number])
                }
              >
                {EXPIRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} dias
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              disabled={createShare.isPending}
              onClick={() => {
                void issue()
              }}
            >
              Gerar link
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {submission && questionnaireCanShare(submission.status)
              ? "Você pode consultar o status, sem gerar um novo link."
              : "Este questionário não aceita um novo link."}
          </p>
        )}

        {issuedUrl ? (
          <div className="space-y-2 rounded-lg border border-border bg-white p-3">
            <p className="text-xs font-semibold tracking-wide text-[var(--avila-gold-600)] uppercase">
              Copie agora
            </p>
            <input
              readOnly
              value={issuedUrl}
              className="w-full rounded-md border border-border bg-[var(--avila-ivory)] px-2 py-1.5 text-sm"
              aria-label="Link do questionário"
            />
            <Button type="button" variant="outline" onClick={() => void copy()}>
              {copied ? "Link copiado" : "Copiar link"}
            </Button>
            <p className="text-xs text-muted-foreground">
              O envio automático por WhatsApp ou e-mail fica para uma próxima etapa. Copie o link e envie pelo canal que preferir.
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Histórico</h3>
          {sharesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando compartilhamentos…</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum compartilhamento ainda.</p>
          ) : (
            shares.map((share) => (
              <article key={share.id} className="rounded-lg border border-border bg-white px-3 py-2">
                <p className="text-sm font-medium">
                  {questionnaireShareStatusLabel(share.status)}
                  {share.id === current?.id ? " · link vigente" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Criado em {formatLeadDetailDate(share.createdAt) ?? "—"} · expira em{" "}
                  {formatLeadDetailDate(share.expiresAt) ?? "—"}
                  {share.createdBy?.name ? ` · ${share.createdBy.name}` : ""}
                </p>
                {canManage && share.status === "active" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    disabled={revokeShare.isPending}
                    onClick={() => {
                      void revoke(share.id)
                    }}
                  >
                    Revogar
                  </Button>
                ) : null}
              </article>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
