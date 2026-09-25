import {
  buildFriendlyPropertySlug,
  normalizePropertyCode,
  withUniqueFriendlySuffix,
} from './property-slug';

describe('property slug', () => {
  it('monta a URL amigável com tipo, bairro, cidade e código', () => {
    expect(
      buildFriendlyPropertySlug({
        type: 'APARTMENT',
        neighborhood: 'Centro',
        city: 'Uberaba',
        bedrooms: 2,
        publicCode: '1234',
      }),
    ).toBe('apartamento-centro-uberaba-2-quartos-cod-1234');
  });

  it('mantém o código no final quando o slug precisa de sufixo', () => {
    const base = 'casa-fabricio-uberaba-cod-5678';
    expect(withUniqueFriendlySuffix(base, 2)).toBe(
      'casa-fabricio-uberaba-2-cod-5678',
    );
  });

  it('aceita código numérico e o prefixo cod-', () => {
    expect(normalizePropertyCode('1234')).toBe('1234');
    expect(normalizePropertyCode('cod-5678')).toBe('5678');
    expect(normalizePropertyCode('centro')).toBeNull();
  });
});
