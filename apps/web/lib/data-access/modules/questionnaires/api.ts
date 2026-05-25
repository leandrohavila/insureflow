import { apiClient } from "@/lib/data-access/api-client";

import {
  normalizeQuestionnaireField,
  normalizeQuestionnaireSubmission,
  normalizeQuestionnaireSubmissionList,
  normalizeQuestionnaireTemplate,
  normalizeQuestionnaireTemplateList,
} from "./normalizers";
import type {
  BackendQuestionnaireField,
  BackendQuestionnaireSubmission,
  BackendQuestionnaireSubmissionListResponse,
  BackendQuestionnaireTemplate,
  BackendQuestionnaireTemplateListResponse,
  CreateQuestionnaireFieldInput,
  CreateQuestionnaireSubmissionInput,
  CreateQuestionnaireTemplateInput,
  QuestionnaireSubmissionListFilters,
  QuestionnaireTemplateListFilters,
  UpdateQuestionnaireFieldInput,
  UpdateQuestionnaireSubmissionInput,
  UpdateQuestionnaireTemplateInput,
} from "./types";

const QUESTIONNAIRE_TEMPLATES_PATH = "/api/questionnaires/templates";
const QUESTIONNAIRE_SUBMISSIONS_PATH = "/api/questionnaires/submissions";

function toTemplateQueryString(filters: QuestionnaireTemplateListFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.status && filters.status !== "all")
    params.set("status", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
}

function toSubmissionQueryString(
  filters: QuestionnaireSubmissionListFilters = {},
) {
  const params = new URLSearchParams();

  if (filters.templateId) params.set("templateId", filters.templateId);
  if (filters.status && filters.status !== "all")
    params.set("status", filters.status);
  if (filters.origin && filters.origin !== "all")
    params.set("origin", filters.origin);
  if (filters.mode && filters.mode !== "all") params.set("mode", filters.mode);
  if (filters.leadId) params.set("leadId", filters.leadId);
  if (filters.customerId) params.set("customerId", filters.customerId);
  if (filters.dealId) params.set("dealId", filters.dealId);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchQuestionnaireTemplates(
  filters: QuestionnaireTemplateListFilters = {},
) {
  const response =
    await apiClient.get<BackendQuestionnaireTemplateListResponse>(
      `${QUESTIONNAIRE_TEMPLATES_PATH}${toTemplateQueryString(filters)}`,
    );
  return normalizeQuestionnaireTemplateList(response);
}

export async function fetchQuestionnaireTemplate(id: string) {
  const template = await apiClient.get<BackendQuestionnaireTemplate>(
    `${QUESTIONNAIRE_TEMPLATES_PATH}/${id}`,
  );
  return normalizeQuestionnaireTemplate(template);
}

export async function createQuestionnaireTemplate(
  input: CreateQuestionnaireTemplateInput,
) {
  const template = await apiClient.post<BackendQuestionnaireTemplate>(
    QUESTIONNAIRE_TEMPLATES_PATH,
    input,
  );
  return normalizeQuestionnaireTemplate(template);
}

export async function updateQuestionnaireTemplate(
  id: string,
  input: UpdateQuestionnaireTemplateInput,
) {
  const template = await apiClient.patch<BackendQuestionnaireTemplate>(
    `${QUESTIONNAIRE_TEMPLATES_PATH}/${id}`,
    input,
  );
  return normalizeQuestionnaireTemplate(template);
}

export async function deleteQuestionnaireTemplate(id: string) {
  return apiClient.delete<
    | { deleted: true; id: string }
    | { deleted: false; archived: true; template: BackendQuestionnaireTemplate }
  >(`${QUESTIONNAIRE_TEMPLATES_PATH}/${id}`);
}

export async function createQuestionnaireField(
  templateId: string,
  input: CreateQuestionnaireFieldInput,
) {
  const field = await apiClient.post<BackendQuestionnaireField>(
    `${QUESTIONNAIRE_TEMPLATES_PATH}/${templateId}/fields`,
    input,
  );
  return normalizeQuestionnaireField(field);
}

export async function fetchQuestionnaireFields(templateId: string) {
  const fields = await apiClient.get<BackendQuestionnaireField[]>(
    `${QUESTIONNAIRE_TEMPLATES_PATH}/${templateId}/fields`,
  );
  return fields.map(normalizeQuestionnaireField);
}

export async function fetchQuestionnaireField(
  templateId: string,
  fieldId: string,
) {
  const field = await apiClient.get<BackendQuestionnaireField>(
    `${QUESTIONNAIRE_TEMPLATES_PATH}/${templateId}/fields/${fieldId}`,
  );
  return normalizeQuestionnaireField(field);
}

export async function updateQuestionnaireField(
  templateId: string,
  fieldId: string,
  input: UpdateQuestionnaireFieldInput,
) {
  const field = await apiClient.patch<BackendQuestionnaireField>(
    `${QUESTIONNAIRE_TEMPLATES_PATH}/${templateId}/fields/${fieldId}`,
    input,
  );
  return normalizeQuestionnaireField(field);
}

export async function deleteQuestionnaireField(
  templateId: string,
  fieldId: string,
) {
  return apiClient.delete<{ deleted: true; id: string }>(
    `${QUESTIONNAIRE_TEMPLATES_PATH}/${templateId}/fields/${fieldId}`,
  );
}

export async function fetchQuestionnaireSubmissions(
  filters: QuestionnaireSubmissionListFilters = {},
) {
  const response =
    await apiClient.get<BackendQuestionnaireSubmissionListResponse>(
      `${QUESTIONNAIRE_SUBMISSIONS_PATH}${toSubmissionQueryString(filters)}`,
    );
  return normalizeQuestionnaireSubmissionList(response);
}

export async function fetchQuestionnaireSubmission(id: string) {
  const submission = await apiClient.get<BackendQuestionnaireSubmission>(
    `${QUESTIONNAIRE_SUBMISSIONS_PATH}/${id}`,
  );
  return normalizeQuestionnaireSubmission(submission);
}

export async function createQuestionnaireSubmission(
  input: CreateQuestionnaireSubmissionInput,
) {
  const submission = await apiClient.post<BackendQuestionnaireSubmission>(
    QUESTIONNAIRE_SUBMISSIONS_PATH,
    input,
  );
  return normalizeQuestionnaireSubmission(submission);
}

export async function updateQuestionnaireSubmission(
  id: string,
  input: UpdateQuestionnaireSubmissionInput,
) {
  const submission = await apiClient.patch<BackendQuestionnaireSubmission>(
    `${QUESTIONNAIRE_SUBMISSIONS_PATH}/${id}`,
    input,
  );
  return normalizeQuestionnaireSubmission(submission);
}

export async function deleteQuestionnaireSubmission(id: string) {
  return apiClient.delete<{ deleted: true; id: string }>(
    `${QUESTIONNAIRE_SUBMISSIONS_PATH}/${id}`,
  );
}
