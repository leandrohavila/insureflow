"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ClipboardList, Loader2, User } from "lucide-react"

import {
  formatFieldAnswer,
  formatSubmissionDate,
  groupFieldsBySection,
  submissionResponsible,
} from "@/components/questionnaires/questionnaire-answer-utils"
import {
  questionnaireStatusLabels,
  questionnaireStatusStyles,
} from "@/components/questionnaires/questionnaire-submission-constants"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  useQuestionnaireFields,
  useQuestionnaireSubmission,
  type QuestionnaireField,
  type QuestionnaireSubmission,
} from "@/lib/data-access/modules/questionnaires"
import { cn } from "@/lib/utils"

type QuestionnaireSubmissionDetailSheetProps = {
  submissionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuestionnaireSubmissionDetailSheet({
  submissionId,
  open,
  onOpenChange,
}: QuestionnaireSubmissionDetailSheetProps) {
  const submissionQuery = useQuestionnaireSubmission(submissionId)
  const submission = submissionQuery.data
  const fieldsQuery = useQuestionnaireFields(submission?.templateId ?? null)

  const fields = useMemo(() => {
    const items = fieldsQuery.data ?? []
    return [...items].sort((a, b) => a.order - b.order)
  }, [fieldsQuery.data])

  const fieldGroups = useMemo(() => groupFieldsBySection(fields), [fields])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-white/[0.08] bg-background/95 p-0 backdrop-blur-xl sm:max-w-xl"
      >
        {submissionQuery.isLoading ? (
          <DetailSheetLoading />
        ) : !submission ? (
          <DetailSheetEmpty />
        ) : (
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-white/[0.06] px-6 py-5 text-left">
              <SheetDescription className="text-xs text-primary">
                {submission.template?.name ?? "Questionário"}
                {submission.template?.version
                  ? ` · v${submission.template.version}`
                  : ""}
              </SheetDescription>
              <SheetTitle className="text-xl font-semibold tracking-[-0.03em]">
                Respostas do questionário
              </SheetTitle>
              <SubmissionMeta submission={submission} />
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {fieldsQuery.isLoading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando campos…
                </p>
              ) : fieldGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum campo configurado neste template.
                </p>
              ) : (
                <div className="space-y-6">
                  {fieldGroups.map((group) => (
                    <section key={group.section} className="space-y-3">
                      <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                        {group.section}
                      </h3>
                      <dl className="space-y-3">
                        {group.fields.map((field) => (
                          <AnswerRow
                            key={field.id}
                            field={field}
                            value={submission.answers[field.key]}
                          />
                        ))}
                      </dl>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailSheetLoading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function DetailSheetEmpty() {
  return (
    <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
      Resposta não encontrada.
    </div>
  )
}

function SubmissionMeta({ submission }: { submission: QuestionnaireSubmission }) {
  const leadName = submission.lead?.name
  const responsible = submissionResponsible(submission.lead?.assignedTo)

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Badge
        variant="outline"
        className={cn(
          "gap-1 rounded-full text-[10px] font-semibold",
          questionnaireStatusStyles[submission.status],
        )}
      >
        <ClipboardList className="size-3" />
        {questionnaireStatusLabels[submission.status]}
      </Badge>
      {leadName ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <User className="size-3" />
          {leadName}
        </span>
      ) : null}
      <span className="text-xs text-muted-foreground">
        {formatSubmissionDate(submission.submittedAt ?? submission.updatedAt)}
      </span>
      <span className="text-xs text-muted-foreground">· {responsible}</span>
      {submission.leadId ? (
        <Link
          href={`/questionarios/respostas?leadId=${submission.leadId}`}
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "h-auto px-0 text-xs",
          )}
        >
          Ver no painel
        </Link>
      ) : null}
    </div>
  )
}

function AnswerRow({
  field,
  value,
}: {
  field: QuestionnaireField
  value: unknown
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">
        {formatFieldAnswer(field, value)}
      </dd>
      {field.helpText ? (
        <p className="mt-1 text-[11px] text-muted-foreground/80">{field.helpText}</p>
      ) : null}
    </div>
  )
}
