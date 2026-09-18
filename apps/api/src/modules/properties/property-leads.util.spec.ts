import { sanitizePropertyLeadMetadata, serializePropertyLead } from './property-leads.util';

describe('sanitizePropertyLeadMetadata', () => {
  it('retorna null para vazio ou não-objeto', () => {
    expect(sanitizePropertyLeadMetadata(undefined)).toBeNull();
    expect(sanitizePropertyLeadMetadata(null)).toBeNull();
    expect(sanitizePropertyLeadMetadata({})).toBeNull();
  });

  it('persiste UTMs e click ids conhecidos', () => {
    expect(
      sanitizePropertyLeadMetadata({
        utm_source: 'google',
        utm_campaign: 'uberaba',
        gclid: 'abc',
        fbclid: 'xyz',
        landingPage: '/imoveis/apto',
        placement: 'hero',
        ignored: 'nope',
      }),
    ).toEqual({
      utm_source: 'google',
      utm_campaign: 'uberaba',
      gclid: 'abc',
      fbclid: 'xyz',
      landingPage: '/imoveis/apto',
      placement: 'hero',
    });
  });

  it('aceita filters como objeto e ignora strings vazias', () => {
    expect(
      sanitizePropertyLeadMetadata({
        utm_source: '',
        filters: { city: 'Uberaba', purpose: 'SALE' },
      }),
    ).toEqual({
      filters: { city: 'Uberaba', purpose: 'SALE' },
    });
  });
});

describe('serializePropertyLead', () => {
  it('expõe propertyTitle null quando não há imóvel', () => {
    const payload = serializePropertyLead({
      id: 'pl1',
      tenantId: 't1',
      businessUnitId: 'bu1',
      propertyId: null,
      name: 'Maria',
      email: null,
      phone: '34999999999',
      message: null,
      source: 'public_portal_home',
      metadata: { utm_source: 'google' },
      createdAt: new Date('2026-08-26T12:00:00.000Z'),
      property: null,
    });

    expect(payload.propertyId).toBeNull();
    expect(payload.propertyTitle).toBeNull();
    expect(payload.propertySlug).toBeNull();
    expect(payload.property).toBeNull();
    expect(payload.source).toBe('public_portal_home');
    expect(payload.metadata).toEqual({ utm_source: 'google' });
  });

  it('inclui título e slug quando o imóvel existe', () => {
    const payload = serializePropertyLead({
      id: 'pl2',
      tenantId: 't1',
      businessUnitId: 'bu1',
      propertyId: 'p1',
      name: 'Maria',
      email: 'maria@example.com',
      phone: null,
      message: 'Quero visita',
      source: 'public_portal',
      metadata: null,
      createdAt: new Date('2026-08-26T12:00:00.000Z'),
      property: { id: 'p1', title: 'Apto Centro', slug: 'apto-centro' },
    });

    expect(payload.propertyTitle).toBe('Apto Centro');
    expect(payload.propertySlug).toBe('apto-centro');
    expect(payload.property).toEqual({
      id: 'p1',
      title: 'Apto Centro',
      slug: 'apto-centro',
    });
  });
});
