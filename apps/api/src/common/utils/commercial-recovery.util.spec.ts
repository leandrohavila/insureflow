import {
  applyLossReasonToReactivation,
  formatRenewalDueDate,
  isFollowUpDueToday,
  isFollowUpOverdue,
  scheduleFollowUpAt,
  shouldCreateRenewalOpportunity,
  shouldCreateRenewalTask,
  shouldSendRenewalReminder,
  utcDaysUntil,
} from './commercial-recovery.util';

describe('commercial-recovery.util', () => {
  const now = new Date(Date.UTC(2026, 7, 20));

  it('agenda follow-up em N dias', () => {
    expect(scheduleFollowUpAt(now, 3).toISOString()).toBe(
      '2026-08-23T00:00:00.000Z',
    );
  });

  it('calcula dias até o vencimento', () => {
    expect(utcDaysUntil(now, new Date(Date.UTC(2026, 9, 19)))).toBe(60);
    expect(utcDaysUntil(now, new Date(Date.UTC(2026, 8, 19)))).toBe(30);
    expect(utcDaysUntil(now, new Date(Date.UTC(2026, 8, 4)))).toBe(15);
  });

  it('cria tarefa comercial quando faltam até 60 dias', () => {
    expect(
      shouldCreateRenewalTask({ daysUntil: 60, taskCreatedAt: null }),
    ).toBe(true);
    expect(
      shouldCreateRenewalTask({
        daysUntil: 10,
        taskCreatedAt: now,
      }),
    ).toBe(false);
  });

  it('envia lembrete quando faltam até 30 dias', () => {
    expect(
      shouldSendRenewalReminder({ daysUntil: 30, reminderSentAt: null }),
    ).toBe(true);
    expect(
      shouldSendRenewalReminder({ daysUntil: 31, reminderSentAt: null }),
    ).toBe(false);
  });

  it('cria oportunidade no pipeline quando faltam até 15 dias', () => {
    expect(
      shouldCreateRenewalOpportunity({
        daysUntil: 15,
        opportunityCreatedAt: null,
      }),
    ).toBe(true);
    expect(
      shouldCreateRenewalOpportunity({
        daysUntil: 16,
        opportunityCreatedAt: null,
      }),
    ).toBe(false);
  });

  it('classifica follow-up atrasado e do dia', () => {
    expect(
      isFollowUpOverdue({
        status: 'PENDING',
        scheduledAt: new Date(Date.UTC(2026, 7, 19)),
        now,
      }),
    ).toBe(true);
    expect(
      isFollowUpDueToday({
        status: 'PENDING',
        scheduledAt: now,
        now,
      }),
    ).toBe(true);
  });

  it('aplica motivo de perda sobre a config do tenant', () => {
    expect(
      applyLossReasonToReactivation({
        tenantEnabled: true,
        tenantIdleDays: 30,
        tenantMaxAttempts: 3,
        reason: {
          reactivationEnabled: false,
          reactivationDays: 90,
          maxAttempts: 1,
        },
      }),
    ).toEqual({ enabled: false, idleDays: 90, maxAttempts: 1 });
  });

  it('formata vencimento em pt-BR UTC', () => {
    expect(formatRenewalDueDate(new Date(Date.UTC(2026, 8, 4)))).toBe(
      '04/09/2026',
    );
  });
});
