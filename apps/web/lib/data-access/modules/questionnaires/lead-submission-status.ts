import type {
  QuestionnaireSubmission,
  QuestionnaireSubmissionListFilters,
  QuestionnaireSubmissionListResponse,
  QuestionnaireSubmissionStatus,
} from "./types";

export const LEAD_STATUS_LOG = {
  update: "LEAD_STATUS_UPDATE",
  cachePatch: "LEAD_STATUS_CACHE_PATCH",
  render: "LEAD_STATUS_RENDER",
} as const;

export function logLeadStatus(
  event: (typeof LEAD_STATUS_LOG)[keyof typeof LEAD_STATUS_LOG],
  detail?: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "production") return;
  console.debug(`[questionnaire-lead-status] ${event}`, detail ?? {});
}

export type LeadQuestionnaireStatus = {
  submissionId: string | null;
  status: QuestionnaireSubmissionStatus | "pending";
  isDraft: boolean;
  label: "pending" | "draft" | QuestionnaireSubmissionStatus;
};

export function parseSubmissionListFilters(
  queryKey: readonly unknown[],
): QuestionnaireSubmissionListFilters | null {
  if (
    queryKey[0] !== "questionnaires" ||
    queryKey[1] !== "submissions" ||
    queryKey[2] !== "list"
  ) {
    return null;
  }

  const filters = queryKey[3];
  if (!filters || typeof filters !== "object") return {};
  return filters as QuestionnaireSubmissionListFilters;
}

export function submissionMatchesListFilters(
  submission: QuestionnaireSubmission,
  filters: QuestionnaireSubmissionListFilters,
): boolean {
  if (filters.leadId && submission.leadId !== filters.leadId) return false;
  if (filters.templateId && submission.templateId !== filters.templateId) {
    return false;
  }
  if (filters.customerId && submission.customerId !== filters.customerId) {
    return false;
  }
  if (filters.dealId && submission.dealId !== filters.dealId) return false;
  if (
    filters.status &&
    filters.status !== "all" &&
    submission.status !== filters.status
  ) {
    return false;
  }
  if (
    filters.origin &&
    filters.origin !== "all" &&
    submission.origin !== filters.origin
  ) {
    return false;
  }
  if (filters.mode && filters.mode !== "all" && submission.mode !== filters.mode) {
    return false;
  }
  return true;
}

/** Última submission relevante do lead (rascunho tem prioridade). */
export function selectLeadQuestionnaireSubmission(
  submissions: QuestionnaireSubmission[],
  templateId?: string,
): QuestionnaireSubmission | null {
  const scoped = templateId
    ? submissions.filter((item) => item.templateId === templateId)
    : submissions.filter((item) => Boolean(item.leadId));

  if (scoped.length === 0) return null;

  const draft = scoped.find((item) => item.status === "draft");
  if (draft) return draft;

  return [...scoped].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0] ?? null;
}

export function deriveLeadQuestionnaireStatus(
  submissions: QuestionnaireSubmission[],
  templateId?: string,
): LeadQuestionnaireStatus {
  const submission = selectLeadQuestionnaireSubmission(submissions, templateId);

  if (!submission) {
    return {
      submissionId: null,
      status: "pending",
      isDraft: false,
      label: "pending",
    };
  }

  return {
    submissionId: submission.id,
    status: submission.status,
    isDraft: submission.status === "draft",
    label: submission.status === "draft" ? "draft" : submission.status,
  };
}

export function upsertSubmissionInListResponse(
  data: QuestionnaireSubmissionListResponse,
  submission: QuestionnaireSubmission,
): QuestionnaireSubmissionListResponse {
  const index = data.data.findIndex((item) => item.id === submission.id);

  if (index >= 0) {
    return {
      ...data,
      data: data.data.map((item, itemIndex) =>
        itemIndex === index ? submission : item,
      ),
    };
  }

  const limit = data.meta.limit ?? data.data.length + 1;
  const nextData = [submission, ...data.data].slice(0, limit);

  return {
    ...data,
    data: nextData,
    meta: {
      ...data.meta,
      total: data.meta.total + 1,
    },
  };
}

export function removeSubmissionFromListResponse(
  data: QuestionnaireSubmissionListResponse,
  submissionId: string,
): QuestionnaireSubmissionListResponse | null {
  const nextData = data.data.filter((item) => item.id !== submissionId);
  if (nextData.length === data.data.length) return null;

  return {
    ...data,
    data: nextData,
    meta: {
      ...data.meta,
      total: Math.max(0, data.meta.total - 1),
    },
  };
}

export function leadSubmissionListFilters(
  leadId: string,
  options?: { templateId?: string; limit?: number },
): QuestionnaireSubmissionListFilters {
  return {
    leadId,
    page: 1,
    limit: options?.limit ?? 5,
    ...(options?.templateId ? { templateId: options.templateId } : {}),
  };
}
