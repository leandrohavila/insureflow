import { suggestOpportunities } from './opportunity-engine.util';

describe('opportunity-engine', () => {
  it('sugere residencial HIGH após compra de imóvel', () => {
    expect(suggestOpportunities(['PROPERTY_BUY'])).toEqual([
      expect.objectContaining({
        type: 'HOME_INSURANCE',
        score: 'HIGH',
        originType: 'PROPERTY_BUY',
      }),
    ]);
  });

  it('sugere vida HIGH a partir de seguro auto', () => {
    expect(suggestOpportunities(['AUTO_INSURANCE'])).toEqual([
      expect.objectContaining({
        type: 'LIFE_INSURANCE',
        score: 'HIGH',
        originType: 'AUTO_INSURANCE',
      }),
    ]);
  });

  it('sugere fiança/residencial para imóvel alugado', () => {
    const [suggestion] = suggestOpportunities(['PROPERTY_RENT']);
    expect(suggestion).toMatchObject({
      type: 'HOME_INSURANCE',
      score: 'HIGH',
      originType: 'PROPERTY_RENT',
    });
    expect(suggestion.reason).toMatch(/fiança/i);
  });

  it('não sugere o que o cliente já possui', () => {
    expect(
      suggestOpportunities(['AUTO_INSURANCE', 'LIFE_INSURANCE']),
    ).toEqual([
      expect.objectContaining({
        type: 'HEALTH_INSURANCE',
        originType: 'LIFE_INSURANCE',
      }),
    ]);
    expect(
      suggestOpportunities([
        'AUTO_INSURANCE',
        'LIFE_INSURANCE',
        'HEALTH_INSURANCE',
      ]),
    ).toEqual([]);
  });
});
