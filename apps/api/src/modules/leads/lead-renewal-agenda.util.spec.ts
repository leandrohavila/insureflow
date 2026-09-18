import {
  buildLeadRenewalAgendaDrafts,
  leadRenewalEventKind,
} from './lead-renewal-agenda.util';

describe('buildLeadRenewalAgendaDrafts', () => {
  it('gera tarefas 60/30/15 dias antes do vencimento', () => {
    const drafts = buildLeadRenewalAgendaDrafts({
      expiresAt: new Date('2026-12-31T12:00:00.000Z'),
      now: new Date('2026-09-01T12:00:00.000Z'),
    });
    expect(drafts.map((item) => item.operationalEventKind)).toEqual([
      leadRenewalEventKind(60),
      leadRenewalEventKind(30),
      leadRenewalEventKind(15),
    ]);
    expect(drafts.every((item) => item.type === 'renewal')).toBe(true);
    expect(drafts.every((item) => item.status === 'pending')).toBe(true);
    expect(
      drafts.every(
        (item) => item.nextFollowUpAt.getTime() === item.occurredAt.getTime(),
      ),
    ).toBe(true);
  });

  it('não agenda datas já vencidas', () => {
    const drafts = buildLeadRenewalAgendaDrafts({
      expiresAt: new Date('2026-09-30T12:00:00.000Z'),
      now: new Date('2026-09-10T12:00:00.000Z'),
    });
    expect(drafts.map((item) => item.operationalEventKind)).toEqual([
      leadRenewalEventKind(15),
    ]);
  });

  it('respeita datas D-60/D-30/D-15 editadas pelo operador', () => {
    const d60 = new Date('2027-02-01T10:00:00.000Z');
    const d30 = new Date('2027-03-01T10:00:00.000Z');
    const drafts = buildLeadRenewalAgendaDrafts({
      expiresAt: new Date('2027-04-15T12:00:00.000Z'),
      now: new Date('2026-09-01T12:00:00.000Z'),
      scheduledAtByDays: { 60: d60, 30: d30 },
    });
    expect(drafts.map((item) => item.operationalEventKind)).toEqual([
      leadRenewalEventKind(60),
      leadRenewalEventKind(30),
    ]);
    expect(drafts[0]?.occurredAt).toEqual(d60);
    expect(drafts[1]?.occurredAt).toEqual(d30);
  });
});
