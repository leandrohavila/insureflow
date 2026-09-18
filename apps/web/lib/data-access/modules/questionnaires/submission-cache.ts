import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/data-access/query-keys";

import {
  LEAD_STATUS_LOG,
  logLeadStatus,
  parseSubmissionListFilters,
  removeSubmissionFromListResponse,
  submissionMatchesListFilters,
  upsertSubmissionInListResponse,
} from "./lead-submission-status";
import type { QuestionnaireSubmission, QuestionnaireSubmissionListResponse } from "./types";

type MutationMeta = { autosave?: boolean; skipListInvalidation?: boolean };

export function getSubmissionMutationMeta(context: unknown): MutationMeta {
  if (!context || typeof context !== "object") return {};
  const record = context as { meta?: MutationMeta };
  return record.meta ?? {};
}

function parseByLeadOptions(queryKey: readonly unknown[]) {
  if (
    queryKey[0] !== "questionnaires" ||
    queryKey[1] !== "submissions" ||
    queryKey[2] !== "byLead"
  ) {
    return null;
  }

  return {
    leadId: String(queryKey[3] ?? ""),
    options: (queryKey[4] ?? {}) as { templateId?: string; limit?: number },
  };
}

export function upsertSubmissionInLeadCaches(
  queryClient: QueryClient,
  submission: QuestionnaireSubmission,
) {
  if (!submission.leadId) return;

  const leadQueries = queryClient.getQueriesData<QuestionnaireSubmissionListResponse>({
    queryKey: [
      "questionnaires",
      "submissions",
      "byLead",
      submission.leadId,
    ],
  });

  for (const [key, parsed] of leadQueries) {
    if (!parsed) continue;

    const meta = parseByLeadOptions(key);
    if (!meta || meta.leadId !== submission.leadId) continue;

    if (
      meta.options.templateId &&
      meta.options.templateId !== submission.templateId
    ) {
      const next = removeSubmissionFromListResponse(parsed, submission.id);
      if (next) {
        queryClient.setQueryData(key, next);
        logLeadStatus(LEAD_STATUS_LOG.cachePatch, {
          action: "remove_wrong_template",
          submissionId: submission.id,
          leadId: submission.leadId,
          templateId: meta.options.templateId,
        });
      }
      continue;
    }

    const next = upsertSubmissionInListResponse(parsed, submission);
    queryClient.setQueryData(key, next);
    logLeadStatus(LEAD_STATUS_LOG.cachePatch, {
      action: "upsert_by_lead",
      submissionId: submission.id,
      leadId: submission.leadId,
      templateId: meta.options.templateId,
    });
  }
}

export function upsertSubmissionInListCaches(
  queryClient: QueryClient,
  submission: QuestionnaireSubmission,
) {
  const listQueries = queryClient.getQueriesData<QuestionnaireSubmissionListResponse>({
    queryKey: queryKeys.questionnaires.submissions.lists(),
  });

  for (const [key, data] of listQueries) {
    if (!data) continue;

    const filters = parseSubmissionListFilters(key);
    if (!filters) continue;

    const matches = submissionMatchesListFilters(submission, filters);
    const contaminated = data.data.some(
      (item) =>
        item.id === submission.id && !submissionMatchesListFilters(item, filters),
    );

    if (matches) {
      const next = upsertSubmissionInListResponse(data, submission);
      queryClient.setQueryData(key, next);
      logLeadStatus(LEAD_STATUS_LOG.cachePatch, {
        action: "upsert",
        submissionId: submission.id,
        leadId: submission.leadId,
        filters,
      });
      continue;
    }

    if (contaminated || data.data.some((item) => item.id === submission.id)) {
      const next = removeSubmissionFromListResponse(data, submission.id);
      if (next) {
        queryClient.setQueryData(key, next);
        logLeadStatus(LEAD_STATUS_LOG.cachePatch, {
          action: "remove_contamination",
          submissionId: submission.id,
          leadId: submission.leadId,
          filters,
        });
      }
    }
  }
}

export function invalidateSubmissionListCaches(
  queryClient: QueryClient,
  submission: QuestionnaireSubmission,
) {
  void queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      if (
        key[0] === "questionnaires" &&
        key[1] === "submissions" &&
        key[2] === "byLead"
      ) {
        return !submission.leadId || key[3] === submission.leadId;
      }

      const filters = parseSubmissionListFilters(key);
      if (!filters) return false;
      if (!submission.leadId) return true;
      return !filters.leadId || filters.leadId === submission.leadId;
    },
  });
}

export function applySubmissionMutationCache(
  queryClient: QueryClient,
  submission: QuestionnaireSubmission,
  context: unknown,
) {
  const meta = getSubmissionMutationMeta(context);

  queryClient.setQueryData(
    queryKeys.questionnaires.submissions.detail(submission.id),
    submission,
  );

  logLeadStatus(LEAD_STATUS_LOG.update, {
    submissionId: submission.id,
    leadId: submission.leadId,
    templateId: submission.templateId,
    status: submission.status,
    autosave: meta.autosave ?? false,
  });

  upsertSubmissionInListCaches(queryClient, submission);
  upsertSubmissionInLeadCaches(queryClient, submission);

  if (meta.autosave || meta.skipListInvalidation) {
    return;
  }

  invalidateSubmissionListCaches(queryClient, submission);

  void queryClient.invalidateQueries({
    queryKey: queryKeys.questionnaires.templates.all,
  });
  if (submission.leadId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
  }
}
