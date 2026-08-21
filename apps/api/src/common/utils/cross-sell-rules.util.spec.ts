import { suggestCrossSellCategories } from './cross-sell-rules.util';

describe('suggestCrossSellCategories', () => {
  it('sugere seguro residencial para quem busca imóvel', () => {
    expect(suggestCrossSellCategories(['PROPERTY_BUY'])).toEqual([
      { originCategory: 'PROPERTY_BUY', suggestedCategory: 'HOME_INSURANCE' },
    ]);
  });

  it('sugere seguro de vida após auto', () => {
    expect(suggestCrossSellCategories(['AUTO_INSURANCE'])).toEqual([
      { originCategory: 'AUTO_INSURANCE', suggestedCategory: 'LIFE_INSURANCE' },
    ]);
  });

  it('não sugere categoria já presente', () => {
    expect(
      suggestCrossSellCategories(['AUTO_INSURANCE', 'LIFE_INSURANCE']),
    ).toEqual([
      {
        originCategory: 'LIFE_INSURANCE',
        suggestedCategory: 'HEALTH_INSURANCE',
      },
    ]);
  });
});
