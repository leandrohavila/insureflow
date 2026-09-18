import {
  addUtcDays,
  buildLostReactivationPatch,
  buildManualReactivatePatch,
  buildNextAttemptPatch,
  buildPostponeReactivationAt,
  daysOverdue,
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
      reasonOverride: { enabled: true, idleDays: 30 },
    });

    expect(patch.lostReason).toBe('Sem orçamento');
    expect(patch.nextReactivationAt).toEqual(
      new Date('2026-08-31T12:00:00.000Z'),
    );
    expect(patch.reactivationAttempts).toBe(0);
  });

  it('usa reactivationDays do motivo mesmo com canal desligado', () => {
    const patch = buildLostReactivationPatch({
      previousStatus: 'contacted',
      nextStatus: 'lost',
      now,
      settings: { enabled: false, idleDays: 30, maxAttempts: 3 },
      reasonOverride: { enabled: true, idleDays: 45 },
    });

    expect(patch.reactivationEnabled).toBe(true);
    expect(patch.reactivationDays).toBe(45);
    expect(patch.nextReactivationAt).toEqual(addUtcDays(now, 45));
  });

  it('não reagenda se o motivo desliga reativação', () => {
    const patch = buildLostReactivationPatch({
      previousStatus: 'contacted',
      nextStatus: 'lost',
      now,
      settings: { enabled: true, idleDays: 30, maxAttempts: 3 },
      reasonOverride: { enabled: false, idleDays: 90 },
    });

    expect(patch.nextReactivationAt).toBeNull();
    expect(patch.reactivationEnabled).toBe(false);
  });

  it('não reagenda se a reativação global estiver desligada sem motivo', () => {
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

  it('reativação manual limpa fila e define status ativo', () => {
    const patch = buildManualReactivatePatch({ now });
    expect(patch.status).toBe('contacted');
    expect(patch.nextReactivationAt).toBeNull();
    expect(patch.lastReactivatedAt).toEqual(now);
  });

  it('adia +7/+15/+30 a partir de agora', () => {
    expect(buildPostponeReactivationAt({ now, days: 7 })).toEqual(
      addUtcDays(now, 7),
    );
    expect(buildPostponeReactivationAt({ now, days: 15 })).toEqual(
      addUtcDays(now, 15),
    );
    expect(buildPostponeReactivationAt({ now, days: 30 })).toEqual(
      addUtcDays(now, 30),
    );
  });

  it('adia com data personalizada futura', () => {
    const at = addUtcDays(now, 10);
    expect(buildPostponeReactivationAt({ now, at })).toEqual(at);
  });

  it('rejeita adiamento para data passada', () => {
    expect(() =>
      buildPostponeReactivationAt({
        now,
        at: new Date('2026-08-01T00:00:00.000Z'),
      }),
    ).toThrow('POSTPONE_AT_MUST_BE_FUTURE');
  });

  it('calcula dias em atraso', () => {
    expect(
      daysOverdue(new Date('2026-08-20T12:00:00.000Z'), now),
    ).toBe(11);
    expect(daysOverdue(now, now)).toBe(0);
  });
});
