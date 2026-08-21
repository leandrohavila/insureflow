import { computeDealScore } from './deal-score.util';

describe('deal-score', () => {
  it('marca renovação e cross-sell como HIGH', () => {
    expect(computeDealScore('RENEWAL')).toBe('HIGH');
    expect(computeDealScore('CROSS_SELL')).toBe('HIGH');
  });

  it('marca lead novo e reativado como MEDIUM', () => {
    expect(computeDealScore('LEAD')).toBe('MEDIUM');
    expect(computeDealScore('REACTIVATION')).toBe('MEDIUM');
  });

  it('marca criação manual como LOW', () => {
    expect(computeDealScore('MANUAL')).toBe('LOW');
  });
});
