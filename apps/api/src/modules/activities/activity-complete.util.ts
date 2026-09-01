export function assertActivityHasOwner(
  performedById: string | null | undefined,
) {
  if (!performedById?.trim()) {
    throw new Error('Atividade precisa de responsável');
  }
}

export function resolveActivityCompletionPatch(input: {
  previousStatus: string;
  nextStatus?: string;
  now?: Date;
}) {
  if (input.nextStatus === undefined) return {};
  if (input.nextStatus === 'completed') {
    return {
      status: 'completed' as const,
      completedAt: input.now ?? new Date(),
    };
  }
  if (input.nextStatus === 'pending' || input.nextStatus === 'cancelled') {
    return {
      status: input.nextStatus,
      completedAt: null,
    };
  }
  return { status: input.nextStatus };
}

export function resolveActivityReschedulePatch(nextAt: Date) {
  return {
    status: 'pending' as const,
    occurredAt: nextAt,
    nextFollowUpAt: nextAt,
    completedAt: null,
  };
}
