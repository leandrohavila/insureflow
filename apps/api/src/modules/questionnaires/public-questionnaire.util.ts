const PUBLIC_TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

export function normalizePublicQuestionnaireToken(token: string) {
  const value = token.trim();
  if (!PUBLIC_TOKEN.test(value)) return null;
  return value;
}

const CLOSED_STATUSES = new Set(['completed', 'submitted', 'reviewed']);

export function isPublicQuestionnaireClosed(status: string) {
  return CLOSED_STATUSES.has(status);
}

export function isPublicQuestionnaireOpen(status: string) {
  return (
    status === 'draft' ||
    status === 'in_progress' ||
    status === 'pending_client'
  );
}

export function publicQuestionnaireInstructions() {
  return 'Preencha uma etapa de cada vez. Você pode voltar, avançar e salvar o progresso. O envio só acontece quando você confirmar no final.';
}

type PublicDefinition = {
  schemaVersion: number;
  branch: string | null;
  sections: unknown;
  fields: unknown;
  rules: unknown[];
};

export function toPublicQuestionnairePayload(input: {
  title: string;
  branch: string | null;
  versionNumber: number | null;
  expiresAt: Date;
  status: string;
  definition: PublicDefinition | null;
  answers?: Record<string, unknown>;
}) {
  const closed = isPublicQuestionnaireClosed(input.status);
  return {
    state: closed ? 'completed' : 'open',
    title: input.title,
    branch: input.branch,
    versionNumber: input.versionNumber,
    expiresAt: input.expiresAt.toISOString(),
    status: input.status,
    instructions: publicQuestionnaireInstructions(),
    definition: closed ? null : input.definition,
    ...(closed ? {} : { answers: input.answers ?? {} }),
  };
}
