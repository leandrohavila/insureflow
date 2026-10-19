import {
  buildLeadAttributeWhere,
  foldLeadSearchText,
  leadPhoneLikePattern,
  leadSearchLikePattern,
} from './lead-list-filters.util';

describe('filtros de leads', () => {
  const now = new Date('2026-10-18T15:00:00.000Z');

  it('ignora filtros vazios', () => {
    expect(
      buildLeadAttributeWhere({
        status: undefined,
        source: '   ',
        interestCategory: undefined,
        mine: false,
      }),
    ).toEqual({});
  });

  it('filtra status, origem parcial, tipo, responsável e período juntos', () => {
    expect(
      buildLeadAttributeWhere({
        status: 'qualified',
        source: 'Whats',
        interestCategory: 'AUTO_INSURANCE',
        mine: true,
        actorUserId: 'user-1',
        createdWithinDays: 7,
        now,
      }),
    ).toEqual({
      status: 'qualified',
      source: { contains: 'Whats', mode: 'insensitive' },
      interestCategories: { has: 'AUTO_INSURANCE' },
      ownerUserId: 'user-1',
      createdAt: { gte: new Date('2026-10-11T15:00:00.000Z') },
    });
  });

  it('não aplica "meus leads" sem usuário autenticado', () => {
    expect(buildLeadAttributeWhere({ mine: true })).toEqual({});
  });

  it('normaliza acentos e curinga da busca', () => {
    expect(foldLeadSearchText(' São Paulo ')).toBe('sao paulo');
    expect(foldLeadSearchText(' José_100% ')).toBe('jose_100%');
    expect(leadSearchLikePattern('José_100%')).toBe('%jose\\_100\\%%');
    expect(leadPhoneLikePattern('(11) 98888-7777')).toBe('%11988887777%');
    expect(leadPhoneLikePattern('ab')).toBeNull();
  });

  it('limpar filtros equivale a não enviar critérios', () => {
    const cleared = buildLeadAttributeWhere({});
    expect(cleared).toEqual({});
    expect(Object.keys(cleared)).toHaveLength(0);
  });
});
