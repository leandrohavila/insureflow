"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ClipboardList, Edit3, Loader2, Save, User, X } from "lucide-react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { QuestionnaireAnswerField } from "@/components/questionnaires/questionnaire-answer-field";
import {
  formatFieldAnswer,
  formatSubmissionDate,
  groupFieldsBySection,
  submissionResponsible,
} from "@/components/questionnaires/questionnaire-answer-utils";
import {
  questionnaireStatusLabels,
  questionnaireStatusStyles,
} from "@/components/questionnaires/questionnaire-submission-constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useQuestionnaireFields,
  useQuestionnaireSubmission,
  useUpdateQuestionnaireSubmission,
  type JsonObject,
  type QuestionnaireField,
  type QuestionnaireSubmission,
} from "@/lib/data-access/modules/questionnaires";
import {
  answersToFormState,
  focusFirstFieldError,
} from "@/lib/questionnaires/questionnaire-form-state";
import {
  buildSubmitAnswers,
  parseQuestionnaireSubmissionErrors,
  validateQuestionnaireAnswersForFinalize,
  type QuestionnaireFieldErrors,
} from "@/lib/questionnaires/questionnaire-field-validation";
import { cn } from "@/lib/utils";

type QuestionnaireSubmissionDetailSheetProps = {
  submissionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuestionnaireSubmissionDetailSheet({
  submissionId,
  open,
  onOpenChange,
}: QuestionnaireSubmissionDetailSheetProps) {
  const submissionQuery = useQuestionnaireSubmission(submissionId);
  const submission = submissionQuery.data;
  const fieldsQuery = useQuestionnaireFields(submission?.templateId ?? null);
  const updateSubmission = useUpdateQuestionnaireSubmission();
  const [isEditing, setIsEditing] = useState(false);
  const [draftAnswers, setDraftAnswers] = useState<JsonObject>({});
  const [fieldErrors, setFieldErrors] = useState<QuestionnaireFieldErrors>({});
  const [submitSummary, setSubmitSummary] = useState<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollRootRef = useRef<HTMLDivElement | null>(null);

  const fields = useMemo(() => {
    const items = fieldsQuery.data ?? [];
    return [...items].sort((a, b) => a.order - b.order);
  }, [fieldsQuery.data]);

  const fieldGroups = useMemo(() => groupFieldsBySection(fields), [fields]);
  const canEditSubmission =
    submission?.status === "submitted" || submission?.status === "reviewed";

  const resetEditState = useCallback(() => {
    setIsEditing(false);
    setDraftAnswers({});
    setFieldErrors({});
    setSubmitSummary(null);
    fieldRefs.current = {};
  }, []);

  useEffect(() => {
    if (!open) resetEditState();
  }, [open, resetEditState]);

  useEffect(() => {
    resetEditState();
  }, [resetEditState, submissionId]);

  function startEditing() {
    if (!submission || fields.length === 0) return;
    setDraftAnswers(answersToFormState(fields, submission.answers));
    setFieldErrors({});
    setSubmitSummary(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    resetEditState();
  }

  function updateAnswer(key: string, value: unknown) {
    setDraftAnswers((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSubmitSummary(null);
  }

  function handleValidationFailure(errors: QuestionnaireFieldErrors) {
    setFieldErrors(errors);
    setSubmitSummary("Corrija os campos destacados antes de salvar.");
    focusFirstFieldError(
      errors,
      fieldRefs.current,
      fields,
      scrollRootRef.current,
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!submission || fields.length === 0) return;

    const errors = validateQuestionnaireAnswersForFinalize(
      fields,
      draftAnswers,
    );
    if (Object.keys(errors).length > 0) {
      handleValidationFailure(errors);
      return;
    }

    setFieldErrors({});
    setSubmitSummary(null);

    try {
      await updateSubmission.mutateAsync({
        id: submission.id,
        input: {
          status: submission.status,
          answers: buildSubmitAnswers(fields, draftAnswers),
        },
        autosave: false,
      });
      resetEditState();
    } catch (error) {
      const parsed = parseQuestionnaireSubmissionErrors(error, fields);
      setFieldErrors(parsed.fieldErrors);
      setSubmitSummary(parsed.summary);
      focusFirstFieldError(
        parsed.fieldErrors,
        fieldRefs.current,
        fields,
        scrollRootRef.current,
      );
    }
  }

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

            <form
              onSubmit={handleSave}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div
                ref={scrollRootRef}
                className="flex-1 overflow-y-auto px-6 py-5"
              >
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
                        {isEditing ? (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {group.fields.map((field) => (
                              <QuestionnaireAnswerField
                                key={field.id}
                                field={field}
                                value={draftAnswers[field.key]}
                                error={fieldErrors[field.key]}
                                onChange={(value) =>
                                  updateAnswer(field.key, value)
                                }
                                registerRef={(element) => {
                                  fieldRefs.current[field.key] = element;
                                }}
                                disabled={updateSubmission.isPending}
                              />
                            ))}
                          </div>
                        ) : (
                          <dl className="space-y-3">
                            {group.fields.map((field) => (
                              <AnswerRow
                                key={field.id}
                                field={field}
                                value={submission.answers[field.key]}
                              />
                            ))}
                          </dl>
                        )}
                      </section>
                    ))}
                  </div>
                )}
              </div>
              <SubmissionActions
                canEdit={canEditSubmission}
                isEditing={isEditing}
                isSaving={updateSubmission.isPending}
                submitSummary={submitSummary}
                onStartEditing={startEditing}
                onCancelEditing={cancelEditing}
              />
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SubmissionActions({
  canEdit,
  isEditing,
  isSaving,
  submitSummary,
  onStartEditing,
  onCancelEditing,
}: {
  canEdit: boolean;
  isEditing: boolean;
  isSaving: boolean;
  submitSummary: string | null;
  onStartEditing: () => void;
  onCancelEditing: () => void;
}) {
  if (!canEdit) return null;

  return (
    <div className="border-t border-white/[0.06] bg-background/95 px-6 py-4">
      {submitSummary ? (
        <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {submitSummary}
        </p>
      ) : null}
      {isEditing ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancelEditing}
            disabled={isSaving}
          >
            <X className="size-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
      ) : (
        <PermissionGate permission="questionnaires:manage">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onStartEditing}>
              <Edit3 className="size-4" />
              Editar
            </Button>
          </div>
        </PermissionGate>
      )}
    </div>
  );
}

function DetailSheetLoading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function DetailSheetEmpty() {
  return (
    <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
      Resposta não encontrada.
    </div>
  );
}

function SubmissionMeta({
  submission,
}: {
  submission: QuestionnaireSubmission;
}) {
  const leadName = submission.lead?.name;
  const responsible = submissionResponsible(submission.lead?.assignedTo);

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
      {submission.updatedBy ? (
        <span className="text-xs text-muted-foreground">
          · Editado por {submission.updatedBy.name}
        </span>
      ) : null}
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
  );
}

function AnswerRow({
  field,
  value,
}: {
  field: QuestionnaireField;
  value: unknown;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <dt className="text-xs font-medium text-muted-foreground">
        {field.label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">
        {formatFieldAnswer(field, value)}
      </dd>
      {field.helpText ? (
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          {field.helpText}
        </p>
      ) : null}
    </div>
  );
}
