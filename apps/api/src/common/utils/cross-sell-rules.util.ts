import type { InterestCategory } from '../constants/interest-categories';

export type CrossSellRule = {
  originCategory: InterestCategory;
  suggestedCategory: InterestCategory;
};

export const CROSS_SELL_RULES: readonly CrossSellRule[] = [
  { originCategory: 'PROPERTY_BUY', suggestedCategory: 'HOME_INSURANCE' },
  { originCategory: 'PROPERTY_RENT', suggestedCategory: 'HOME_INSURANCE' },
  { originCategory: 'PROPERTY_SELL', suggestedCategory: 'HOME_INSURANCE' },
  { originCategory: 'PROPERTY_INVESTMENT', suggestedCategory: 'HOME_INSURANCE' },
  { originCategory: 'AUTO_INSURANCE', suggestedCategory: 'LIFE_INSURANCE' },
  { originCategory: 'HOME_INSURANCE', suggestedCategory: 'LIFE_INSURANCE' },
  { originCategory: 'LIFE_INSURANCE', suggestedCategory: 'HEALTH_INSURANCE' },
];

export function suggestCrossSellCategories(
  categories: readonly string[],
): CrossSellRule[] {
  const owned = new Set(categories);
  return CROSS_SELL_RULES.filter(
    (rule) =>
      owned.has(rule.originCategory) && !owned.has(rule.suggestedCategory),
  );
}
