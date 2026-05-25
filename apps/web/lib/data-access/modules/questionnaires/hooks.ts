"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/data-access/query-keys";

import {
  deriveLeadQuestionnaireStatus,
  leadSubmissionListFilters,
} from "./lead-submission-status";
import { applySubmissionMutationCache } from "./submission-cache";
import {
  createQuestionnaireField,
  createQuestionnaireSubmission,
  createQuestionnaireTemplate,
  deleteQuestionnaireField,
  deleteQuestionnaireSubmission,
  deleteQuestionnaireTemplate,
  fetchQuestionnaireField,
  fetchQuestionnaireFields,
  fetchQuestionnaireSubmission,
  fetchQuestionnaireSubmissions,
  fetchQuestionnaireTemplate,
  fetchQuestionnaireTemplates,
  updateQuestionnaireField,
  updateQuestionnaireSubmission,
  updateQuestionnaireTemplate,
} from "./api";
import type {
  CreateQuestionnaireFieldInput,
  CreateQuestionnaireSubmissionInput,
  QuestionnaireSubmissionListFilters,
  QuestionnaireTemplate,
  QuestionnaireTemplateListFilters,
  UpdateQuestionnaireFieldInput,
  UpdateQuestionnaireSubmissionInput,
  UpdateQuestionnaireTemplateInput,
} from "./types";

export type CreateQuestionnaireSubmissionVariables =
  CreateQuestionnaireSubmissionInput & {
    autosave?: boolean;
  };

export type UpdateQuestionnaireSubmissionVariables = {
  id: string;
  input: UpdateQuestionnaireSubmissionInput;
  autosave?: boolean;
};

export function useQuestionnaireTemplates(
  filters: QuestionnaireTemplateListFilters = {},
) {
  return useQuery({
    queryKey: queryKeys.questionnaires.templates.list(filters),
    queryFn: () => fetchQuestionnaireTemplates(filters),
  });
}

export function useQuestionnaireTemplate(id: string | null) {
  return useQuery({
    queryKey: id
      ? queryKeys.questionnaires.templates.detail(id)
      : queryKeys.questionnaires.templates.details(),
    queryFn: () => fetchQuestionnaireTemplate(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateQuestionnaireTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuestionnaireTemplate,
    onSuccess: (template) => {
      queryClient.setQueryData<QuestionnaireTemplate>(
        queryKeys.questionnaires.templates.detail(template.id),
        template,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.all,
      });
    },
  });
}

export function useUpdateQuestionnaireTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateQuestionnaireTemplateInput;
    }) => updateQuestionnaireTemplate(id, input),
    onSuccess: (template) => {
      queryClient.setQueryData<QuestionnaireTemplate>(
        queryKeys.questionnaires.templates.detail(template.id),
        template,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.all,
      });
    },
  });
}

export function useDeleteQuestionnaireTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuestionnaireTemplate,
    onSettled: (_result, _error, id) => {
      queryClient.removeQueries({
        queryKey: queryKeys.questionnaires.templates.detail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.all,
      });
    },
  });
}

export function useCreateQuestionnaireField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input: CreateQuestionnaireFieldInput;
    }) => createQuestionnaireField(templateId, input),
    onSuccess: (_field, { templateId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.fields(templateId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.detail(templateId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.all,
      });
    },
  });
}

export function useQuestionnaireFields(templateId: string | null) {
  return useQuery({
    queryKey: templateId
      ? queryKeys.questionnaires.templates.fields(templateId)
      : queryKeys.questionnaires.templates.all,
    queryFn: () => fetchQuestionnaireFields(templateId as string),
    enabled: Boolean(templateId),
  });
}

export function useQuestionnaireField(
  templateId: string | null,
  fieldId: string | null,
) {
  return useQuery({
    queryKey:
      templateId && fieldId
        ? queryKeys.questionnaires.templates.field(templateId, fieldId)
        : queryKeys.questionnaires.templates.all,
    queryFn: () =>
      fetchQuestionnaireField(templateId as string, fieldId as string),
    enabled: Boolean(templateId && fieldId),
  });
}

export function useUpdateQuestionnaireField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      fieldId,
      input,
    }: {
      templateId: string;
      fieldId: string;
      input: UpdateQuestionnaireFieldInput;
    }) => updateQuestionnaireField(templateId, fieldId, input),
    onSuccess: (field, { templateId }) => {
      queryClient.setQueryData(
        queryKeys.questionnaires.templates.field(templateId, field.id),
        field,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.fields(templateId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.detail(templateId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.all,
      });
    },
  });
}

export function useDeleteQuestionnaireField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      fieldId,
    }: {
      templateId: string;
      fieldId: string;
    }) => deleteQuestionnaireField(templateId, fieldId),
    onSettled: (_result, _error, { templateId, fieldId }) => {
      queryClient.removeQueries({
        queryKey: queryKeys.questionnaires.templates.field(templateId, fieldId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.fields(templateId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.detail(templateId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.all,
      });
    },
  });
}

export function useQuestionnaireSubmissions(
  filters: QuestionnaireSubmissionListFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.questionnaires.submissions.list(filters),
    queryFn: () => fetchQuestionnaireSubmissions(filters),
    enabled: options?.enabled ?? true,
  });
}

export function useLeadQuestionnaireSubmissions(
  leadId: string | null,
  options?: {
    templateId?: string;
    limit?: number;
    enabled?: boolean;
  },
) {
  const limit = options?.limit ?? 5;
  const byLeadKey = leadId
    ? queryKeys.questionnaires.submissions.byLead(leadId, {
        templateId: options?.templateId,
        limit,
      })
    : queryKeys.questionnaires.submissions.details();

  const filters = leadId
    ? leadSubmissionListFilters(leadId, {
        templateId: options?.templateId,
        limit,
      })
    : { page: 1, limit: 0 };

  return useQuery({
    queryKey: byLeadKey,
    queryFn: () => fetchQuestionnaireSubmissions(filters),
    enabled: Boolean(leadId) && (options?.enabled ?? true),
    select: (response) => ({
      ...response,
      leadStatus: deriveLeadQuestionnaireStatus(
        response.data,
        options?.templateId,
      ),
    }),
  });
}

export function useQuestionnaireSubmission(id: string | null) {
  return useQuery({
    queryKey: id
      ? queryKeys.questionnaires.submissions.detail(id)
      : queryKeys.questionnaires.submissions.details(),
    queryFn: () => fetchQuestionnaireSubmission(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateQuestionnaireSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ autosave, ...input }: CreateQuestionnaireSubmissionVariables) => {
      void autosave
      return createQuestionnaireSubmission(input)
    },
    onSuccess: (submission, variables) => {
      applySubmissionMutationCache(queryClient, submission, {
        meta: { autosave: variables.autosave },
      });
    },
  });
}

export function useUpdateQuestionnaireSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
      autosave,
    }: UpdateQuestionnaireSubmissionVariables) => {
      void autosave
      return updateQuestionnaireSubmission(id, input)
    },
    onSuccess: (submission, variables) => {
      applySubmissionMutationCache(queryClient, submission, {
        meta: { autosave: variables.autosave },
      });
    },
  });
}

export function useDeleteQuestionnaireSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuestionnaireSubmission,
    onSettled: (_result, _error, id) => {
      queryClient.removeQueries({
        queryKey: queryKeys.questionnaires.submissions.detail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.submissions.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaires.templates.all,
      });
    },
  });
}
