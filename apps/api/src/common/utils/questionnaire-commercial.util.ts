export type QuestionnaireCommercialStatus =
  | 'pending'
  | 'draft'
  | 'submitted'
  | 'reviewed'
  | 'archived';

type SubmissionPick = {
  id: string;
  status: string;
  updatedAt: Date;
  submittedAt?: Date | null;
};

export function deriveQuestionnaireCommercialStatus(
  submissions: SubmissionPick[],
): {
  status: QuestionnaireCommercialStatus;
  submissionId: string | null;
  updatedAt: Date | null;
} {
  if (submissions.length === 0) {
    return { status: 'pending', submissionId: null, updatedAt: null };
  }

  const draft = submissions.find((item) => item.status === 'draft');
  const latest = draft ?? submissions[0];
  const status =
    latest.status === 'draft'
      ? 'draft'
      : latest.status === 'submitted'
        ? 'submitted'
        : latest.status === 'reviewed'
          ? 'reviewed'
          : latest.status === 'archived'
            ? 'archived'
            : 'pending';

  return {
    status,
    submissionId: latest.id,
    updatedAt: latest.updatedAt,
  };
}

export function buildDraftQuestionnaireWarning(hasDraft: boolean) {
  if (!hasDraft) return [];
  return [
    {
      code: 'draft_questionnaire',
      message: 'Existe questionário em rascunho para este lead.',
      severity: 'warning' as const,
    },
  ];
}
