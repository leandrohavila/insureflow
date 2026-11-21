import type { QuestionnaireSubmissionStatus } from './dto/questionnaire.dto';

const TRANSITIONS: Record<
  QuestionnaireSubmissionStatus,
  readonly QuestionnaireSubmissionStatus[]
> = {
  draft: [
    'in_progress',
    'pending_client',
    'submitted',
    'completed',
    'cancelled',
    'archived',
  ],
  in_progress: [
    'draft',
    'pending_client',
    'submitted',
    'completed',
    'cancelled',
  ],
  pending_client: [
    'draft',
    'in_progress',
    'submitted',
    'completed',
    'expired',
    'cancelled',
  ],
  submitted: ['reviewed', 'archived'],
  reviewed: ['archived'],
  archived: [],
  completed: [],
  expired: ['cancelled'],
  cancelled: [],
};

const LOCKED = new Set<QuestionnaireSubmissionStatus>([
  'submitted',
  'reviewed',
  'archived',
  'completed',
  'expired',
  'cancelled',
]);

const COMPLETION = new Set<QuestionnaireSubmissionStatus>([
  'submitted',
  'reviewed',
  'completed',
]);

const SHAREABLE = new Set<QuestionnaireSubmissionStatus>([
  'draft',
  'in_progress',
  'pending_client',
]);

const REVISABLE = new Set<QuestionnaireSubmissionStatus>([
  'submitted',
  'reviewed',
  'completed',
]);

export function canTransitionQuestionnaireStatus(
  from: QuestionnaireSubmissionStatus,
  to: QuestionnaireSubmissionStatus,
) {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}

export function isQuestionnaireAnswerLocked(
  status: QuestionnaireSubmissionStatus,
) {
  return LOCKED.has(status);
}

export function isQuestionnaireCompletionStatus(
  status: QuestionnaireSubmissionStatus,
) {
  return COMPLETION.has(status);
}

export function canShareQuestionnaire(status: QuestionnaireSubmissionStatus) {
  return SHAREABLE.has(status);
}

export function canReviseQuestionnaire(status: QuestionnaireSubmissionStatus) {
  return REVISABLE.has(status);
}
