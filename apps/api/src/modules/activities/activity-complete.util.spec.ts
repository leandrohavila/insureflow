import {
  assertActivityHasOwner,
  resolveActivityCompletionPatch,
  resolveActivityReschedulePatch,
} from './activity-complete.util';

describe('activity complete and reschedule', () => {
  it('recusa atividade sem responsável', () => {
    expect(() => assertActivityHasOwner('')).toThrow(
      'Atividade precisa de responsável',
    );
    expect(() => assertActivityHasOwner('user-1')).not.toThrow();
  });

  it('marca completedAt ao concluir', () => {
    const now = new Date('2026-09-01T12:00:00.000Z');
    expect(
      resolveActivityCompletionPatch({
        previousStatus: 'pending',
        nextStatus: 'completed',
        now,
      }),
    ).toEqual({ status: 'completed', completedAt: now });
  });

  it('reagenda para pending sem completedAt', () => {
    const next = new Date('2026-09-08T14:00:00.000Z');
    expect(resolveActivityReschedulePatch(next)).toEqual({
      status: 'pending',
      occurredAt: next,
      nextFollowUpAt: next,
      completedAt: null,
    });
  });
});
