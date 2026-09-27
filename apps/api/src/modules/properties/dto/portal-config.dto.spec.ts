import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpsertPortalConfigDto } from './portal-config.dto';

function errorsFor(input: Record<string, unknown>) {
  const dto = plainToInstance(UpsertPortalConfigDto, {
    businessUnitId: 'bu-1',
    companyName: 'Ávila Imóveis',
    ...input,
  });
  return validateSync(dto).map((error) => error.property);
}

describe('UpsertPortalConfigDto', () => {
  it('accepts a valid public slug and portal URL', () => {
    expect(
      errorsFor({
        publicSlug: 'avila-imoveis-2',
        portalUrl: 'https://imoveis.grupoavila.com.br',
      }),
    ).toEqual([]);
  });

  it.each(['avila imoveis', 'ávila@imóveis!', 'Avila-Imoveis', '-avila'])(
    'rejects public slug %p',
    (publicSlug) => {
      expect(errorsFor({ publicSlug })).toEqual(['publicSlug']);
    },
  );

  it.each(['imoveis.grupoavila.com.br', 'ftp://imoveis.grupoavila.com.br'])(
    'rejects portal URL %p',
    (portalUrl) => {
      expect(errorsFor({ portalUrl })).toEqual(['portalUrl']);
    },
  );

  it('treats blank slug and URL as not informed', () => {
    expect(errorsFor({ publicSlug: '  ', portalUrl: '' })).toEqual([]);
  });

  it('rejects blank company name and invalid e-mail', () => {
    expect(errorsFor({ companyName: '   ' })).toEqual(['companyName']);
    expect(errorsFor({ email: 'contato@' })).toEqual(['email']);
  });
});
