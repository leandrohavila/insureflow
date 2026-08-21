import {
  elapsedDaysFromHours,
  escalationLevelsDue,
  isIdleSince,
  shouldAlertIdleRenewal,
} from './sales-sla.util';

describe('sales-sla', () => {
  it('escalona corretor, gestor e diretor por dias no estágio', () => {
    expect(escalationLevelsDue(2)).toEqual([]);
    expect(escalationLevelsDue(3)).toEqual(['OWNER']);
    expect(escalationLevelsDue(5)).toEqual(['OWNER', 'MANAGER']);
    expect(escalationLevelsDue(7)).toEqual(['OWNER', 'MANAGER', 'DIRECTOR']);
  });

  it('converte horas em dias cheios no estágio', () => {
    expect(elapsedDaysFromHours(71.9)).toBe(2);
    expect(elapsedDaysFromHours(72)).toBe(3);
  });

  it('alerta renovação ociosa ou vencida', () => {
    const now = new Date('2026-08-20T12:00:00.000Z');
    expect(
      shouldAlertIdleRenewal({
        status: 'RENEWAL_PENDING',
        renewalDate: '2026-09-04T00:00:00.000Z',
        updatedAt: '2026-08-10T12:00:00.000Z',
        now,
      }),
    ).toBe(true);
    expect(
      shouldAlertIdleRenewal({
        status: 'RENEWED',
        renewalDate: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        now,
      }),
    ).toBe(false);
    expect(
      isIdleSince({
        lastMovementAt: '2026-08-19T12:00:00.000Z',
        idleDays: 7,
        now,
      }),
    ).toBe(false);
  });
});
