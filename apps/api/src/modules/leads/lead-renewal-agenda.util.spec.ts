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
});
