import {
  addUtcDays,
  buildLostReactivationPatch,
  buildNextAttemptPatch,
  isLeadEligibleForReactivation,
} from './lead-reactivation.util';

describe('lead-reactivation.util', () => {
  const now = new Date('2026-08-31T10:00:00.000Z');

  it('agenda próxima tentativa a partir da data de perda', () => {
    const patch = buildLostReactivationPatch({
      previousStatus: 'qualified',
      nextStatus: 'lost',
      lostReason: 'Sem orçamento',
      now: new Date('2026-08-01T12:00:00.000Z'),
      settings: { enabled: true, idleDays: 30, maxAttempts: 3 },
    });

    expect(patch.lostReason).toBe('Sem orçamento');
    expect(patch.nextReactivationAt).toEqual(
      new Date('2026-08-31T12:00:00.000Z'),
    );
    expect(patch.reactivationAttempts).toBe(0);
  });

  it('não reagenda se a reativação global estiver desligada', () => {
    const patch = buildLostReactivationPatch({
      previousStatus: 'contacted',
      nextStatus: 'lost',
      now,
      settings: { enabled: false, idleDays: 30, maxAttempts: 3 },
    });

    expect(patch.nextReactivationAt).toBeNull();
    expect(patch.reactivationEnabled).toBe(false);
  });

  it('elegível apenas quando perdido, habilitado, no prazo e abaixo do limite', () => {
    expect(
      isLeadEligibleForReactivation({
        status: 'lost',
        reactivationEnabled: true,
        nextReactivationAt: now,
        reactivationAttempts: 1,
        maxAttempts: 3,
        now,
      }),
    ).toBe(true);

    expect(
      isLeadEligibleForReactivation({
        status: 'lost',
        reactivationEnabled: true,
        nextReactivationAt: now,
        reactivationAttempts: 3,
        maxAttempts: 3,
        now,
      }),
    ).toBe(false);
  });

  it('incrementa tentativa e projeta a próxima data', () => {
    const patch = buildNextAttemptPatch({
      now,
      currentAttempts: 0,
      idleDays: 30,
    });

    expect(patch.reactivationAttempts).toBe(1);
    expect(patch.nextReactivationAt).toEqual(addUtcDays(now, 30));
  });
});
