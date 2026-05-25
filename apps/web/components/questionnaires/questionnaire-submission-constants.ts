import type { QuestionnaireSubmissionStatus } from "@/lib/data-access/modules/questionnaires"

export const questionnaireStatusLabels: Record<
  QuestionnaireSubmissionStatus,
  string
> = {
  draft: "Rascunho",
  submitted: "Enviado",
  reviewed: "Revisado",
  archived: "Arquivado",
}

export const questionnaireStatusStyles: Record<
  QuestionnaireSubmissionStatus,
  string
> = {
  draft: "border-slate-400/30 bg-slate-500/10 text-slate-200",
  submitted: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  reviewed: "border-primary/35 bg-primary/15 text-primary-foreground",
  archived: "border-amber-400/30 bg-amber-500/10 text-amber-200",
}
