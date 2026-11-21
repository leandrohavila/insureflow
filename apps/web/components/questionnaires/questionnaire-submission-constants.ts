import type { QuestionnaireSubmissionStatus } from "@/lib/data-access/modules/questionnaires"

export const questionnaireStatusLabels: Record<
  QuestionnaireSubmissionStatus,
  string
> = {
  draft: "Rascunho",
  in_progress: "Em preenchimento",
  pending_client: "Aguardando cliente",
  submitted: "Enviado",
  reviewed: "Revisado",
  completed: "Concluído",
  expired: "Expirado",
  cancelled: "Cancelado",
  archived: "Arquivado",
}

export const questionnaireStatusStyles: Record<
  QuestionnaireSubmissionStatus,
  string
> = {
  draft: "border-slate-400/30 bg-slate-500/10 text-slate-200",
  in_progress: "border-sky-400/35 bg-sky-500/10 text-sky-200",
  pending_client: "border-amber-400/35 bg-amber-500/10 text-amber-200",
  submitted: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  reviewed: "border-primary/35 bg-primary/15 text-primary-foreground",
  completed: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  expired: "border-zinc-400/30 bg-zinc-500/10 text-zinc-300",
  cancelled: "border-zinc-400/30 bg-zinc-500/10 text-zinc-300",
  archived: "border-amber-400/30 bg-amber-500/10 text-amber-200",
}
