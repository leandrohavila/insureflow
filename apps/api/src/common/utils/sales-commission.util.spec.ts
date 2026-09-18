import {
  computeCommissionValue,
  defaultCommissionPercent,
  targetScopeKey,
} from './sales-commission.util';

describe('sales-commission', () => {
  it('calcula percentual e 1 aluguel (100%)', () => {
    expect(
      computeCommissionValue({ dealValue: 1000, percentage: 15, productType: 'AUTO' }),
    ).toBe(150);
    expect(
      computeCommissionValue({
        dealValue: 2500,
        percentage: 100,
        productType: 'LOCACAO',
      }),
    ).toBe(2500);
  });

  it('usa taxas padrão da corretora e da imobiliária', () => {
    expect(
      defaultCommissionPercent({ productType: 'VIDA', unitType: 'INSURANCE' }),
    ).toBe(25);
    expect(
      defaultCommissionPercent({ productType: 'VENDA', unitType: 'REAL_ESTATE' }),
    ).toBe(3);
  });

  it('gera chave de meta sem duplicar escopos nulos', () => {
    expect(
      targetScopeKey({ businessUnitId: 'bu-1', userId: null, teamId: null }),
    ).toBe('bu-1::');
    expect(
      targetScopeKey({ businessUnitId: 'bu-1', userId: 'u1', teamId: null }),
    ).toBe('bu-1:u1:');
  });
});
